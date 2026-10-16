import {cableDefinition,cableStatus} from './sandbox-cables.js';
import {DEVICE_CATALOG,deviceDefinition,expandPorts} from './device-catalog.js';
export const kinds=Object.freeze(DEVICE_CATALOG.map(d=>d.id));
export const emptyNetwork=()=>({version:1,devices:[],links:[]});
export function createDevice(kind,id,x=150,y=150){
 const definition=deviceDefinition(kind);if(!definition)throw Error('Unknown device type.');
 return {id,kind,name:definition.hostnamePrefix+' '+id.slice(-4),x,y,...structuredClone(definition.defaultConfig),ports:expandPorts(definition).map(({name,media})=>({name,media,enabled:true,ip:'',prefix:24,vlan:1}))};
}
const ipNumber=ip=>ip.split('.').reduce((n,s)=>(n*256+Number(s))>>>0,0);
export const validIP=ip=>typeof ip==='string'&&/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(ip)&&ip.split('.').every(n=>+n<=255);
const mask=p=>p===0?0:(0xffffffff<<(32-p))>>>0;
export const sameSubnet=(a,b,p)=>((ipNumber(a)&mask(p))>>>0)===((ipNumber(b)&mask(p))>>>0);
const hostIP=(ip,p)=>{const n=ipNumber(ip),m=mask(p),net=(n&m)>>>0;return n!==net&&n!==((net|(~m>>>0))>>>0)&&n!==0&&n<0xe0000000&&n>=0x01000000&&ip.split('.')[0]!=='127';};
export function endpoint(net,e){const device=net.devices.find(d=>d.id===e.device),port=device?.ports.find(p=>p.name===e.port);return {device,port};}
const key=e=>e.device+'/'+e.port;
export function validateNetwork(net){
 if(net===undefined)return;
 if(!net||net.version!==1||!Array.isArray(net.devices)||net.devices.length>50||!Array.isArray(net.links)||net.links.length>100)throw Error('Invalid topology; maximum 50 devices and 100 cables.');
 if(net.realism!==undefined&&!['beginner','exam'].includes(net.realism))throw Error('Invalid realism mode.');
 const ids=new Set();
 for(const d of net.devices){
  if(!d||typeof d.id!=='string'||!/^[a-zA-Z0-9_-]{1,50}$/.test(d.id)||ids.has(d.id)||!kinds.includes(d.kind)||typeof d.name!=='string'||!d.name.trim()||d.name.length>40||!Number.isFinite(d.x)||!Number.isFinite(d.y)||d.x<60||d.x>940||d.y<50||d.y>550||typeof d.power!=='boolean')throw Error('Invalid device.');ids.add(d.id);
  const expected=createDevice(d.kind,d.id).ports;
  if(!Array.isArray(d.ports)||d.ports.length!==expected.length||new Set(d.ports.map(p=>p?.name)).size!==expected.length)throw Error('Invalid device ports.');
  for(const p of d.ports){if(!p||!expected.some(e=>e.name===p.name&&e.media===p.media)||typeof p.enabled!=='boolean'||typeof p.ip!=='string'||!Number.isInteger(p.prefix)||p.prefix<1||p.prefix>30||!Number.isInteger(p.vlan)||p.vlan<1||p.vlan>4094||p.ip&&(!validIP(p.ip)||!hostIP(p.ip,p.prefix))||deviceDefinition(d.kind).capabilities.forwardsL2&&p.ip)throw Error('Invalid interface. Use a usable unicast IPv4 address and /1–/30 prefix.');}
  if(typeof d.gateway!=='string'||d.gateway&&!validIP(d.gateway)||!Array.isArray(d.routes)||d.routes.length>16||!deviceDefinition(d.kind).capabilities.routesL3&&d.routes.length)throw Error('Invalid gateway or routes.');
  for(const r of d.routes)if(!r||!validIP(r.network)||!Number.isInteger(r.prefix)||r.prefix<0||r.prefix>30||((ipNumber(r.network)&mask(r.prefix))>>>0)!==ipNumber(r.network)||!validIP(r.nextHop))throw Error('Static routes require an aligned network, /0–/30 prefix, and a next-hop IPv4 address.');
 }
 const used=new Set(),linkIds=new Set();
 for(const l of net.links){if(!l||typeof l.id!=='string'||!/^[a-zA-Z0-9_-]{1,50}$/.test(l.id)||linkIds.has(l.id)||!l.a||!l.b||!['fiber','copper'].includes(l.media))throw Error('Invalid cable.');linkIds.add(l.id);if(l.cableType!==undefined&&cableDefinition(l.cableType)?.media!==l.media)throw Error('Invalid cable type for this media.');
  const a=endpoint(net,l.a),b=endpoint(net,l.b);
  if(!a.port||!b.port||l.a.device===l.b.device||used.has(key(l.a))||used.has(key(l.b))||a.port.media!==l.media||b.port.media!==l.media)throw Error('Choose two free compatible ports on different devices. Copper uses Ethernet ports; fiber uses SFP ports.');
  used.add(key(l.a));used.add(key(l.b));
 }
}
export function connect(net,a,b,media,id,cableType){const link={id,a,b,media,...(cableType?{cableType}:{})};const test={...net,links:[...net.links,link]};validateNetwork(test);net.links.push(link);}
export function removeDevice(net,id){net.devices=net.devices.filter(d=>d.id!==id);net.links=net.links.filter(l=>l.a.device!==id&&l.b.device!==id);}
export const linkStatus=cableStatus;
export function linkUp(net,l){return linkStatus(net,l).up;}
