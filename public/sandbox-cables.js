import {DEVICE_CATALOG,deviceDefinition,expandPorts} from './device-catalog.js';
export const CABLE_TYPES=[{id:'straight',label:'Copper straight-through',media:'copper'},{id:'crossover',label:'Copper crossover',media:'copper'},{id:'fiber',label:'Fiber',media:'fiber'},{id:'serial',label:'Serial',media:'serial'},{id:'console',label:'Console',media:'console'}].filter(c=>DEVICE_CATALOG.some(d=>d.ports.some(p=>p.media===c.media)));
export const cableDefinition=id=>CABLE_TYPES.find(c=>c.id===id);
export function copperCompatible(a,b,type,mode='beginner'){return mode==='beginner'||a==='auto'||b==='auto'||(a===b?type==='crossover':type==='straight');}
export function portProblem(net,end,type,start=null){
 const d=net.devices.find(d=>d.id===end.device),p=d?.ports.find(p=>p.name===end.port),c=cableDefinition(type);
 if(!p||!c)return 'Unknown port or cable.';
 if(start?.device===end.device)return start.port===end.port?'Same port: choose a different device.':'Same device: self-connections are not allowed.';
 const l=net.links.find(l=>[l.a,l.b].some(e=>e.device===end.device&&e.port===end.port));
 if(l){const other=l.a.device===end.device?l.b:l.a;return 'In use, connected to '+(net.devices.find(d=>d.id===other.device)?.name||other.device)+' '+other.port;}
 if(p.media!==c.media)return p.name+' needs a '+p.media+' cable.';
 return '';
}
export function cableStatus(net,l){
 const endpoints=[l.a,l.b].map(e=>{const d=net.devices.find(d=>d.id===e.device);return {d,p:d?.ports.find(p=>p.name===e.port),template:d&&expandPorts(deviceDefinition(d.kind)).find(p=>p.name===e.port)};});
 if(endpoints.some(e=>!e.d?.power))return {up:false,reason:'Device is powered off or missing.'};
 if(endpoints.some(e=>!e.p?.enabled))return {up:false,reason:'Interface is disabled or missing.'};
 // Legacy cables retain their automatic MDI-X behavior in either mode.
 if(net.realism==='exam'&&l.media==='copper'&&l.cableType){const [a,b]=endpoints.map(e=>e.template.mdi);if(!copperCompatible(a,b,l.cableType,'exam'))return {up:false,reason:a===b?'Like MDI roles need a copper crossover cable in Exam mode.':'Unlike MDI roles need a copper straight-through cable in Exam mode.'};}
 return {up:true,reason:l.media==='copper'&&!l.cableType?'Link up — legacy automatic copper cable.':'Link up'};
}
