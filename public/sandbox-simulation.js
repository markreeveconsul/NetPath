import {validateNetwork,validIP,sameSubnet,endpoint,linkUp} from './sandbox-topology.js';
export const emptySimulation=()=>({version:1,time:0,topology:null,arp:[],mac:[]});
const epKey=e=>e.device+'/'+e.port;
function selectRoute(d,dest){
 const ports=d.ports.filter(p=>p.enabled&&p.ip);
 const choices=ports.filter(p=>sameSubnet(dest,p.ip,p.prefix)).map(p=>({prefix:p.prefix,port:p,nextHop:dest}));
 if(d.kind==='router')for(const r of d.routes.filter(r=>sameSubnet(dest,r.network,r.prefix)))choices.push({prefix:r.prefix,port:ports.filter(p=>sameSubnet(r.nextHop,p.ip,p.prefix)).sort((a,b)=>b.prefix-a.prefix)[0],nextHop:r.nextHop});
 if(d.kind!=='router'&&!choices.length&&d.gateway)choices.push({prefix:0,port:ports.find(p=>sameSubnet(d.gateway,p.ip,p.prefix)),nextHop:d.gateway});
 return choices.sort((a,b)=>b.prefix-a.prefix)[0];
}
// All runtime state is supplied and returned. Time is simulated seconds, never wall time.
export function simulate(topology,action,previous=emptySimulation(),options={}){
 validateNetwork(topology);if(!topology)throw Error('A topology is required.');
 if(!action||action.type!=='ping'||!validIP(action.destination))throw Error('Enter a destination IPv4 address.');
 const source=topology.devices.find(d=>d.id===action.sourceId);
 if(!source||source.kind==='switch')throw Error('Choose a PC, server, or router as source.');
 const ttl=action.ttl??64,now=options.now??previous?.time;
 if(!Number.isInteger(ttl)||ttl<1||ttl>255)throw Error('TTL must be an integer from 1 to 255.');
 if(!previous||previous.version!==1||!Number.isFinite(previous.time)||previous.time<0||!Array.isArray(previous.arp)||!Array.isArray(previous.mac)||!Number.isFinite(now)||now<previous.time)throw Error('Invalid simulation state or clock.');
 const fingerprint=JSON.stringify(topology),state=previous.topology===fingerprint?structuredClone(previous):emptySimulation();
 state.time=now;state.topology=fingerprint;
 const trace=[],path=[],links=new Set();let hop=0,phase='request',packetSource='',packetDestination=action.destination,remaining=ttl;
 const emit=(device,layer,decision,reasonCode,details={})=>trace.push({hop,device,layer,decision,reasonCode,phase,source:packetSource,destination:packetDestination,ttl:remaining,details});
 for(const table of ['arp','mac']){
  if(state[table].length>10000)throw Error('Simulation table is too large.');
  for(const row of state[table])if(!row||!Number.isFinite(row.expires)||typeof row.device!=='string'||typeof row.port!=='string'||typeof row.mac!=='string')throw Error('Invalid simulation table.');
  state[table]=state[table].filter(row=>{if(row.expires<=now){emit(row.device,2,'expire',table==='arp'?'ARP_EXPIRED':'MAC_EXPIRED',{...row});return false;}return true;});
 }
 const macs=new Map();let address=1;
 for(const d of [...topology.devices].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0))for(const p of d.ports)macs.set(epKey({device:d.id,port:p.name}),'02:00:00:'+(address++).toString(16).padStart(6,'0').match(/../g).join(':'));
 const mac=e=>macs.get(epKey(e));
 function rememberArp(local,ip,hardware){state.arp=state.arp.filter(r=>!(r.device===local.device&&r.port===local.port&&r.ip===ip));state.arp.push({...local,ip,mac:hardware,expires:now+120});}
 // A frame learns its source at every ingress. Unknown destinations flood only within the access VLAN.
 function frame(start,src,dst){
  const queue=[{ep:start,path:[start.device],links:[]}],seen=new Set(),found=[];
  while(queue.length){const item=queue.shift();if(seen.has(epKey(item.ep)))continue;seen.add(epKey(item.ep));
   const cable=topology.links.find(l=>epKey(l.a)===epKey(item.ep)||epKey(l.b)===epKey(item.ep));
   if(!cable||!linkUp(topology,cable))continue;
   const far=epKey(cable.a)===epKey(item.ep)?cable.b:cable.a,{device:d,port:p}=endpoint(topology,far),travel={path:[...item.path,d.id],links:[...item.links,cable.id]};
   if(d.kind!=='switch'){if(dst===null||mac(far)===dst)found.push({ep:far,...travel});continue;}
   state.mac=state.mac.filter(r=>!(r.device===d.id&&r.vlan===p.vlan&&r.mac===src));
   state.mac.push({device:d.id,port:p.name,vlan:p.vlan,mac:src,expires:now+300});
   emit(d.id,2,'learn','MAC_LEARN',{mac:src,port:p.name,vlan:p.vlan});
   const known=dst&&state.mac.find(r=>r.device===d.id&&r.vlan===p.vlan&&r.mac===dst);
   emit(d.id,2,known?'forward':'flood',known?'MAC_FORWARD':dst?'MAC_FLOOD':'ARP_FLOOD',{port:known?.port??p.name,vlan:p.vlan});
   seen.add(epKey(far));
   for(const out of d.ports)if(out.name!==p.name&&out.enabled&&out.vlan===p.vlan&&(!known||out.name===known.port))queue.push({ep:{device:d.id,port:out.name},...travel});
  }return found;
 }
 const finish=(ok,reasonCode)=>({result:{ok,reasonCode,path,links:[...links]},trace,nextState:state});
 const fail=(device,code,details={})=>{emit(device,3,'drop',code,details);return code;};
 function walk(start,dest,origin){let current=start,forwarded=false;remaining=ttl;
  for(let budget=0;budget<257;budget++){
   const d=topology.devices.find(d=>d.id===current);path.push(current);
   if(!d?.power)return fail(current,'DEVICE_OFF');
   if(d.ports.some(p=>p.enabled&&p.ip===dest)){emit(d.id,3,'deliver','ECHO_RECEIVED');return null;}
   if(forwarded){if(d.kind!=='router')return fail(current,'HOST_CANNOT_FORWARD');if(remaining<=1)return fail(current,'TTL_EXPIRED');remaining--;hop++;emit(current,3,'forward','TTL_DECREMENT');}
   const route=selectRoute(d,dest);
   if(!route)return fail(current,'NO_ROUTE');
   if(!route.port)return fail(current,'NEXT_HOP_OFF_SUBNET');
   if(route.nextHop===route.port.ip)return fail(current,'NEXT_HOP_SELF');
   emit(current,3,'route','ROUTE_SELECTED',{port:route.port.name,nextHop:route.nextHop,prefix:route.prefix});
   const local={device:d.id,port:route.port.name};
   let neighbor=state.arp.find(r=>r.device===d.id&&r.port===route.port.name&&r.ip===route.nextHop);
   if(!neighbor){
    emit(current,2,'resolve','ARP_REQUEST',{ip:route.nextHop,port:route.port.name});
    const peers=frame(local,mac(local),null).filter(x=>endpoint(topology,x.ep).port.ip===route.nextHop);
    if(peers.length!==1)return fail(current,peers.length?'DUPLICATE_IP':'ARP_NO_REPLY',{ip:route.nextHop});
    const peer=peers[0],remote=endpoint(topology,peer.ep);
    if(!sameSubnet(route.port.ip,remote.port.ip,remote.port.prefix))return fail(remote.device.id,'ASYMMETRIC_SUBNET');
    rememberArp(peer.ep,route.port.ip,mac(local));
    if(!frame(peer.ep,mac(peer.ep),mac(local)).some(x=>epKey(x.ep)===epKey(local)))return fail(current,'ARP_NO_REPLY',{ip:route.nextHop});
    rememberArp(local,route.nextHop,mac(peer.ep));neighbor=state.arp.find(r=>r.device===d.id&&r.port===route.port.name&&r.ip===route.nextHop);
    emit(current,2,'learn','ARP_REPLY',{ip:route.nextHop,mac:neighbor.mac});
   }else emit(current,2,'lookup','ARP_CACHE_HIT',{ip:route.nextHop,mac:neighbor.mac});
   const receivers=frame(local,mac(local),neighbor.mac);
   if(!receivers.length)return fail(current,'FRAME_UNDELIVERED');
   const peer=receivers[0];for(const id of peer.path.slice(1,-1))path.push(id);for(const id of peer.links)links.add(id);
   current=peer.ep.device;forwarded=true;
  }return fail(current,'EVENT_LIMIT');
 }
 const first=selectRoute(source,action.destination)?.port||source.ports.find(p=>p.enabled&&p.ip);
 if(!source.power||!first){fail(source.id,'SOURCE_UNCONFIGURED');return finish(false,'SOURCE_UNCONFIGURED');}
 packetSource=first.ip;
 let error=walk(source.id,action.destination,first.ip);if(error)return finish(false,error);
 const arrival=path.at(-1);phase='reply';packetSource=action.destination;packetDestination=first.ip;hop=0;
 error=walk(arrival,first.ip,action.destination);return finish(!error,error||'PING_SUCCESS');
}
