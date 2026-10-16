export const kinds=['pc','server','switch','router'];
export const emptyNetwork=()=>({version:1,devices:[],links:[]});
export function createDevice(kind,id,x=150,y=150){
 if(!kinds.includes(kind))throw Error('Unknown device type.');
 const names=kind==='switch'?['Gi0/1','Gi0/2','Gi0/3','Gi0/4','SFP0/1']:kind==='router'?['Gi0/0','Gi0/1','SFP0/0']:['Eth0'];
 return {id,kind,name:kind.toUpperCase()+' '+id.slice(-4),x,y,power:true,gateway:'',routes:[],ports:names.map(name=>({name,media:name.startsWith('SFP')?'fiber':'copper',enabled:true,ip:'',prefix:24,vlan:1}))};
}
const ipNumber=ip=>ip.split('.').reduce((n,s)=>(n*256+Number(s))>>>0,0);
export const validIP=ip=>typeof ip==='string'&&/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(ip)&&ip.split('.').every(n=>+n<=255);
const mask=p=>p===0?0:(0xffffffff<<(32-p))>>>0;
const sameSubnet=(a,b,p)=>((ipNumber(a)&mask(p))>>>0)===((ipNumber(b)&mask(p))>>>0);
const hostIP=(ip,p)=>{const n=ipNumber(ip),m=mask(p),net=(n&m)>>>0;return n!==net&&n!==((net|(~m>>>0))>>>0)&&n!==0&&n<0xe0000000&&n>=0x01000000&&ip.split('.')[0]!=='127';};
export function endpoint(net,e){const device=net.devices.find(d=>d.id===e.device),port=device?.ports.find(p=>p.name===e.port);return {device,port};}
const key=e=>e.device+'/'+e.port;
export function validateNetwork(net){
 if(net===undefined)return;
 if(!net||net.version!==1||!Array.isArray(net.devices)||net.devices.length>30||!Array.isArray(net.links)||net.links.length>60)throw Error('Invalid topology; maximum 30 devices and 60 cables.');
 const ids=new Set();
 for(const d of net.devices){
  if(!d||typeof d.id!=='string'||!/^[a-zA-Z0-9_-]{1,50}$/.test(d.id)||ids.has(d.id)||!kinds.includes(d.kind)||typeof d.name!=='string'||!d.name.trim()||d.name.length>40||!Number.isFinite(d.x)||!Number.isFinite(d.y)||d.x<60||d.x>940||d.y<50||d.y>550||typeof d.power!=='boolean')throw Error('Invalid device.');ids.add(d.id);
  const expected=createDevice(d.kind,d.id).ports;
  if(!Array.isArray(d.ports)||d.ports.length!==expected.length||new Set(d.ports.map(p=>p?.name)).size!==expected.length)throw Error('Invalid device ports.');
  for(const p of d.ports){if(!p||!expected.some(e=>e.name===p.name&&e.media===p.media)||typeof p.enabled!=='boolean'||typeof p.ip!=='string'||!Number.isInteger(p.prefix)||p.prefix<1||p.prefix>30||!Number.isInteger(p.vlan)||p.vlan<1||p.vlan>4094||p.ip&&(!validIP(p.ip)||!hostIP(p.ip,p.prefix))||d.kind==='switch'&&p.ip)throw Error('Invalid interface. Use a usable unicast IPv4 address and /1–/30 prefix.');}
  if(typeof d.gateway!=='string'||d.gateway&&!validIP(d.gateway)||!Array.isArray(d.routes)||d.routes.length>16||d.kind!=='router'&&d.routes.length)throw Error('Invalid gateway or routes.');
  for(const r of d.routes)if(!r||!validIP(r.network)||!Number.isInteger(r.prefix)||r.prefix<0||r.prefix>30||((ipNumber(r.network)&mask(r.prefix))>>>0)!==ipNumber(r.network)||!validIP(r.nextHop))throw Error('Static routes require an aligned network, /0–/30 prefix, and a next-hop IPv4 address.');
 }
 const used=new Set(),linkIds=new Set();
 for(const l of net.links){if(!l||typeof l.id!=='string'||!/^[a-zA-Z0-9_-]{1,50}$/.test(l.id)||linkIds.has(l.id)||!l.a||!l.b||!['fiber','copper'].includes(l.media))throw Error('Invalid cable.');linkIds.add(l.id);
  const a=endpoint(net,l.a),b=endpoint(net,l.b);
  if(!a.port||!b.port||l.a.device===l.b.device||used.has(key(l.a))||used.has(key(l.b))||a.port.media!==l.media||b.port.media!==l.media)throw Error('Choose two free compatible ports on different devices. Copper uses Ethernet ports; fiber uses SFP ports.');
  used.add(key(l.a));used.add(key(l.b));
 }
}
export function connect(net,a,b,media,id){const link={id,a,b,media};const test={...net,links:[...net.links,link]};validateNetwork(test);net.links.push(link);}
export function removeDevice(net,id){net.devices=net.devices.filter(d=>d.id!==id);net.links=net.links.filter(l=>l.a.device!==id&&l.b.device!==id);}
export function linkUp(net,l){const a=endpoint(net,l.a),b=endpoint(net,l.b);return Boolean(a.device?.power&&b.device?.power&&a.port?.enabled&&b.port?.enabled);}
// Broadcast-domain reachability: switches bridge only equal access VLANs.
function l2(net,start){const queue=[{ep:start,path:[start.device],links:[]}],seen=new Set(),found=[];
 while(queue.length){const item=queue.shift();if(seen.has(key(item.ep)))continue;seen.add(key(item.ep));const here=endpoint(net,item.ep);if(!here.device?.power||!here.port?.enabled)continue;
  const cable=net.links.find(l=>key(l.a)===key(item.ep)||key(l.b)===key(item.ep));if(!cable||!linkUp(net,cable))continue;
  const far=key(cable.a)===key(item.ep)?cable.b:cable.a,other=endpoint(net,far),path=[...item.path,far.device],links=[...item.links,cable.id];
  if(other.device.kind!=='switch'){found.push({ep:far,path,links});continue;}
  // Mark ingress too, preventing switch loops from cycling indefinitely.
  seen.add(key(far));for(const p of other.device.ports)if(p.name!==far.port&&p.enabled&&p.vlan===other.port.vlan)queue.push({ep:{device:far.device,port:p.name},path,links});
 }return found;
}
function walk(net,start,dest,sourceIP){let current=start;const steps=[],path=[start],links=[];const fail=message=>({ok:false,message,steps,path,links});
 for(let ttl=16;ttl>0;ttl--){const d=net.devices.find(d=>d.id===current);if(!d?.power)return fail('Device is powered off.');
  if(d.ports.some(p=>p.enabled&&p.ip===dest)){steps.push({device:d.id,message:'Destination interface received the IPv4 echo packet.',source:sourceIP,destination:dest,ttl});return {ok:true,message:'Destination reached.',steps,path,links};}
  const ports=d.ports.filter(p=>p.enabled&&p.ip),choices=ports.filter(p=>sameSubnet(dest,p.ip,p.prefix)).map(p=>({prefix:p.prefix,port:p,nextHop:dest}));
  if(d.kind==='router')for(const r of d.routes.filter(r=>sameSubnet(dest,r.network,r.prefix))){const p=ports.filter(p=>sameSubnet(r.nextHop,p.ip,p.prefix)).sort((a,b)=>b.prefix-a.prefix)[0];choices.push({prefix:r.prefix,port:p,nextHop:r.nextHop});}
  else if(!choices.length&&d.gateway){const p=ports.find(p=>sameSubnet(d.gateway,p.ip,p.prefix));choices.push({prefix:0,port:p,nextHop:d.gateway});}
  choices.sort((a,b)=>b.prefix-a.prefix);const route=choices[0];
  if(!route)return fail(d.name+': no matching route'+(d.kind==='router'?'.':' or default gateway.'));
  if(!route.port)return fail(d.name+': next hop is not on an enabled, configured local interface.');
  if(route.nextHop===route.port.ip)return fail(d.name+': next hop points to this interface itself.');
  const peers=l2(net,{device:d.id,port:route.port.name}).filter(x=>endpoint(net,x.ep).port.ip===route.nextHop);
  steps.push({device:d.id,message:`ARP resolution for ${route.nextHop} via ${route.port.name}; ${peers.length?'neighbor found':'no response'}.`,source:sourceIP,destination:dest,ttl});
  if(peers.length!==1)return fail(d.name+(peers.length?': duplicate next-hop addresses on this LAN.':': no ARP response. Check cables, power, ports, access VLANs, and neighbor addressing.'));
  const peer=peers[0],end=endpoint(net,peer.ep),ingress=end.port;
  if(!sameSubnet(route.port.ip,ingress.ip,ingress.prefix))return fail(end.device.name+': asymmetric interface subnets; check both masks.');
  for(const id of peer.path.slice(1)){path.push(id);if(id!==end.device.id)steps.push({device:id,message:'Ethernet frame forwarded within the ingress access VLAN.',source:sourceIP,destination:dest,ttl});}links.push(...peer.links);
  if(route.nextHop!==dest&&end.device.kind!=='router')return fail(end.device.name+': a host cannot forward traffic as a router.');
  current=end.device.id;
 }return fail('TTL exhausted: a routing loop or path longer than 16 routing decisions.');
}
export function ping(net,sourceId,destination){validateNetwork(net);if(!validIP(destination))throw Error('Enter a destination IPv4 address.');const source=net.devices.find(d=>d.id===sourceId);if(!source||source.kind==='switch')throw Error('Choose a PC, server, or router as source.');
 const interfaces=source.ports.filter(p=>p.enabled&&p.ip);const local=interfaces.filter(p=>sameSubnet(destination,p.ip,p.prefix)).sort((a,b)=>b.prefix-a.prefix)[0];const first=local||interfaces[0];
 if(!source.power||!first)return {ok:false,message:'Source is off or has no enabled IPv4 interface.',steps:[],path:[sourceId],links:[]};
 const outward=walk(net,sourceId,destination,first.ip);if(!outward.ok)return {...outward,message:'Request failed: '+outward.message};
 const arrival=outward.path.at(-1),reply=walk(net,arrival,first.ip,destination);
 return {ok:reply.ok,message:reply.ok?`Echo request and reply delivered: ${first.ip} ↔ ${destination}.`:'Request arrived, but reply failed: '+reply.message,steps:[...outward.steps,...reply.steps.map(s=>({...s,message:'Reply · '+s.message}))],path:[...outward.path,...reply.path.slice(1)],links:[...new Set([...outward.links,...reply.links])]};
}
export function exampleNetwork(){const n=emptyNetwork();const a=createDevice('pc','pc1',150,190),s=createDevice('switch','sw1',370,190),r=createDevice('router','r1',600,190),b=createDevice('server','srv1',830,330);a.name='Office PC';s.name='Access switch';r.name='Office router';b.name='Attendance';a.ports[0].ip='192.168.10.10';a.gateway='192.168.10.1';r.ports[0].ip='192.168.10.1';r.ports[1].ip='192.168.20.1';b.ports[0].ip='192.168.20.10';b.gateway='192.168.20.1';n.devices=[a,s,r,b];connect(n,{device:'pc1',port:'Eth0'},{device:'sw1',port:'Gi0/1'},'copper','c1');connect(n,{device:'sw1',port:'Gi0/2'},{device:'r1',port:'Gi0/0'},'copper','c2');connect(n,{device:'r1',port:'Gi0/1'},{device:'srv1',port:'Eth0'},'copper','c3');return n;}
