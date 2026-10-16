export function subnet(ip,prefix){const parts=ip.split('.').map(Number);if(parts.length!==4||parts.some((v,i)=>!/^\d+$/.test(ip.split('.')[i])||v<0||v>255)||!Number.isInteger(prefix)||prefix<1||prefix>30)throw Error('Enter a valid IPv4 address and a prefix from /1 to /30.');const n=parts.reduce((a,b)=>a*256+b,0),size=2**(32-prefix),network=Math.floor(n/size)*size;const fmt=x=>[24,16,8,0].map(b=>Math.floor(x/2**b)%256).join('.');return {network:fmt(network),broadcast:fmt(network+size-1),first:fmt(network+1),last:fmt(network+size-2),hosts:size-2,mask:fmt(2**32-size),size,prefix};}
export function nextReview(previous,rating,now=Date.now()){const days=rating==='again'?0:rating==='hard'?1:rating==='good'?Math.max(2,Math.round((previous?.interval||1)*2.5)):Math.max(4,(previous?.interval||1)*4);return {interval:days,due:now+(rating==='again'?600000:days*86400000)};}
export function shuffled(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createTerminal(){return {mode:'user',hostname:'Switch',vlan:null,vlans:{1:'default'},interfaces:{'fastethernet0/1':{vlan:1,mode:'dynamic auto'},'fastethernet0/2':{vlan:1,mode:'dynamic auto'}},iface:null,saved:false,task:null};}
export function terminalCommand(t,raw){const c=raw.trim().toLowerCase().replace(/\s+/g,' ');const prompt=t.hostname+({user:'>',priv:'#',config:'(config)#',vlan:'(config-vlan)#',interface:'(config-if)#'}[t.mode]);let out='';if(!c)return {prompt,out};
if(c==='help'||c==='?')out='Supported subset: enable, configure terminal, hostname NAME, vlan 1–4094, name NAME, interface fastEthernet0/1 or 0/2, switchport mode access, switchport access vlan ID, exit, end, show vlan brief, show running-config, copy running-config startup-config. This is a teaching sandbox, not Cisco IOS.';
else if(c==='enable'&&t.mode==='user')t.mode='priv';
else if((c==='configure terminal'||c==='conf t')&&t.mode==='priv')t.mode='config';
else if(c==='end'&&['config','vlan','interface'].includes(t.mode))t.mode='priv';
else if(c==='exit'){if(['vlan','interface'].includes(t.mode))t.mode='config';else if(t.mode==='config')t.mode='priv';else if(t.mode==='priv')t.mode='user';}
else if(c==='show vlan brief'&&t.mode==='priv')out='VLAN  Name                  Ports\n'+Object.entries(t.vlans).map(([id,name])=>`${id.padEnd(6)}${name.padEnd(22)}${Object.entries(t.interfaces).filter(([,v])=>v.vlan===Number(id)).map(([k])=>k).join(', ')}`).join('\n');
else if(c==='show running-config'&&t.mode==='priv')out=`hostname ${t.hostname}\n`+Object.entries(t.vlans).map(([id,n])=>`vlan ${id}\n name ${n}`).join('\n')+'\n'+Object.entries(t.interfaces).map(([k,v])=>`interface ${k}\n switchport mode ${v.mode}\n switchport access vlan ${v.vlan}`).join('\n');
else if(c==='copy running-config startup-config'&&t.mode==='priv'){t.saved=true;out='Building configuration...\n[OK] (saved within this sandbox session only)';}
else if(/^hostname [a-z][a-z0-9-]{0,30}$/.test(c)&&t.mode==='config'){t.hostname=raw.trim().split(/\s+/)[1];t.saved=false;}
else if(/^vlan \d+$/.test(c)&&t.mode==='config'){const n=Number(c.split(' ')[1]);if(n<1||n>4094)out='% VLAN must be 1–4094';else{t.vlans[n]??='VLAN'+n;t.vlan=n;t.mode='vlan';t.saved=false;}}
else if(/^name [\w-]+$/.test(c)&&t.mode==='vlan'){t.vlans[t.vlan]=raw.trim().split(/\s+/)[1];t.saved=false;}
else if(/^interface (fastethernet0\/[12]|fa0\/[12])$/.test(c)&&t.mode==='config'){t.iface=c.split(' ')[1].replace(/^fa0/,'fastethernet0');t.mode='interface';}
else if(c==='switchport mode access'&&t.mode==='interface'){t.interfaces[t.iface].mode='access';t.saved=false;}
else if(/^switchport access vlan \d+$/.test(c)&&t.mode==='interface'){const n=Number(c.split(' ')[3]);if(!t.vlans[n])out='% Create this VLAN first in this teaching sandbox.';else{t.interfaces[t.iface].vlan=n;t.saved=false;}}
else out='% Unsupported command or incorrect mode. Type help for the supported practice commands.';
return {prompt,out};}
