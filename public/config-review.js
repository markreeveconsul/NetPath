// Reviews a bounded, explicit subset of IOS running-config syntax.
// It never executes commands or claims to verify live forwarding.
function canonical(line){return line.trim().toLowerCase().replace(/\s+/g,' ').replace(/gigabitethernet/g,'gi').replace(/fastethernet/g,'fa');}
export function parseConfig(text){
 if(typeof text!=='string'||text.length>100000)throw Error('Paste at most 100,000 characters of configuration.');
 const blocks=new Map(),global=[];let current=null;
 for(const raw of text.split(/\r?\n/)){
  const line=canonical(raw);if(!line)continue;
  if(line==='!'||line==='exit'||line==='end'){current=null;continue;}
  if(/^(interface |router |ip access-list |line |vlan )/.test(line)){current=line;if(!blocks.has(current))blocks.set(current,[]);continue;}
  // Running-config child commands are indented. Pasted command scripts must use exit between blocks.
  if(current&&/^\S/.test(raw)&&!/^(switchport|ip |ipv6 |no |shutdown|name |login|transport|passive-interface|network |router-id|permit |deny |\d+ (permit|deny)|spanning-tree)/.test(line))current=null;
  if(current)blocks.get(current).push(line);else global.push(line);
 }
 return {blocks,global};
}
const task=(id,title,lesson,requirement,checks,sample)=>({id,title,lesson,requirement,checks,sample});
const exact=(block,command)=>p=>(block?p.blocks.get(block)||[]:p.global).includes(command);
const check=(label,block,command)=>({label,test:exact(block,command),hint:`Expected in ${block||'global configuration'}: ${command}`});
export const configTasks=[
task('access','VLAN 10 access port','vlan','Submit S1 running-config for VLAN 10 named ENGINEERING and an enabled Fa0/1 access port assigned to VLAN 10.',[
check('VLAN exists with the intended name','vlan 10','name engineering'),check('Fa0/1 uses static access mode','interface fa0/1','switchport mode access'),check('Fa0/1 belongs to VLAN 10','interface fa0/1','switchport access vlan 10'),{label:'Fa0/1 is not administratively disabled',test:p=>p.blocks.has('interface fa0/1')&&!exact('interface fa0/1','shutdown')(p),hint:'Remove shutdown from the intended interface; a running-config may omit the default enabled state.'}],`vlan 10
 name ENGINEERING
!
interface FastEthernet0/1
 switchport mode access
 switchport access vlan 10
!`),
task('ipv6','R1 IPv6 static routing','static','Submit R1 running-config from the IPv6 routing lab. This checks R1 only; R2 and host connectivity require separate observation.',[
check('IPv6 forwarding is enabled',null,'ipv6 unicast-routing'),check('LAN IPv6 address','interface gi0/0','ipv6 address 2001:db8:10::1/64'),check('Transit IPv6 address','interface gi0/1','ipv6 address 2001:db8:12::1/64'),check('Remote LAN route',null,'ipv6 route 2001:db8:20::/64 2001:db8:12::2'),{label:'Both intended interfaces are enabled',test:p=>['interface gi0/0','interface gi0/1'].every(i=>p.blocks.has(i)&&!exact(i,'shutdown')(p)),hint:'Check shutdown state on both interfaces.'}],`ipv6 unicast-routing
ipv6 route 2001:db8:20::/64 2001:db8:12::2
!
interface GigabitEthernet0/0
 ipv6 address 2001:db8:10::1/64
!
interface GigabitEthernet0/1
 ipv6 address 2001:db8:12::2/64
!`),
task('ospf','R1 OSPF advertisement','ospf','Submit R1 running-config for OSPF process 1 in the two-router lab. Neighbor state cannot be established from configuration alone.',[
check('Router ID','router ospf 1','router-id 1.1.1.1'),check('Transit advertisement','router ospf 1','network 10.0.0.0 0.0.0.3 area 0'),check('LAN advertisement','router ospf 1','network 192.168.10.0 0.0.0.255 area 0'),check('LAN is passive','router ospf 1','passive-interface gi0/0'),{label:'Transit is not explicitly passive',test:p=>!exact('router ospf 1','passive-interface gi0/1')(p)&&!exact('router ospf 1','passive-interface default')(p),hint:'This checker supports explicit passive-interface gi0/0, not passive-default with exceptions.'}],`router ospf 1
 router-id 1.1.1.1
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.10.0 0.0.0.255 area 0
 passive-interface GigabitEthernet0/1
!`),
task('security','Sticky port-security policy','l2-security','Submit the Fa0/1 block from the port-security lab. This verifies explicit policy settings, not the learned endpoint or violation counters.',[
check('Static access mode','interface fa0/1','switchport mode access'),check('Port security enabled','interface fa0/1','switchport port-security'),check('Sticky learning enabled','interface fa0/1','switchport port-security mac-address sticky'),{label:'Maximum is one (explicit or default)',test:p=>{const c=p.blocks.get('interface fa0/1')||[];return !c.some(l=>l.startsWith('switchport port-security maximum ')&&l!=='switchport port-security maximum 1');},hint:'Use maximum 1; its default may be omitted from running-config.'},{label:'Shutdown violation mode (explicit or default)',test:p=>{const c=p.blocks.get('interface fa0/1')||[];return !c.some(l=>l.startsWith('switchport port-security violation ')&&l!=='switchport port-security violation shutdown');},hint:'Use violation shutdown; its default may be omitted.'}],`interface FastEthernet0/1
 switchport mode access
 switchport port-security
 switchport port-security mac-address sticky
 switchport port-security violation restrict
!`),
task('relay','Client-facing DHCP relay','dhcp-dns','Submit the Gi0/0 block for the DHCP relay guide. The server address is 192.168.70.2; the client gateway is 192.168.60.1/24.',[
check('Client gateway address','interface gi0/0','ip address 192.168.60.1 255.255.255.0'),check('Helper is on the client interface','interface gi0/0','ip helper-address 192.168.70.2'),{label:'Client interface enabled',test:p=>p.blocks.has('interface gi0/0')&&!exact('interface gi0/0','shutdown')(p),hint:'The receiving client interface must not be administratively disabled.'}],`interface GigabitEthernet0/0
 ip address 192.168.60.1 255.255.255.0
!
interface GigabitEthernet0/1
 ip helper-address 192.168.70.2
!`),
task('acl','Ordered LAN policy','acl','Submit the named LAB-POLICY ACL and its R1 Gi0/0 attachment. Required order: permit .10, deny other LAN-A sources, permit other IP traffic.',[
{label:'Exact intended rule order',test:p=>{const lines=(p.blocks.get('ip access-list extended lab-policy')||[]).map(l=>l.replace(/^\d+ /,'')).filter(l=>/^(permit|deny) /.test(l));return JSON.stringify(lines)===JSON.stringify(['permit ip host 192.168.10.10 any','deny ip 192.168.10.0 0.0.0.255 any','permit ip any any']);},hint:'This exercise expects the three rules in exactly the specified order, without additional permit/deny entries.'},check('Attached inbound on Gi0/0','interface gi0/0','ip access-group lab-policy in')],`ip access-list extended LAB-POLICY
 deny ip 192.168.10.0 0.0.0.255 any
 permit ip host 192.168.10.10 any
 permit ip any any
!
interface GigabitEthernet0/0
 ip access-group LAB-POLICY in
!`)
];
export function reviewConfig(id,text){const t=configTasks.find(t=>t.id===id);if(!t)throw Error('Unknown configuration exercise.');const p=parseConfig(text),checks=t.checks.map(c=>({label:c.label,passed:Boolean(c.test(p)),hint:c.hint}));return {id,score:checks.filter(c=>c.passed).length,total:checks.length,checks,scope:'Submitted configuration only; no live connectivity verification.'};}
