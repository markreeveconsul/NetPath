import {validateNetwork,sameSubnet} from './sandbox-topology.js';
// Diagnostics do not reject valid but misconfigured teaching topologies.
export function lintNetwork(net){validateNetwork(net);const issues=[];
 for(const d of net.devices){
  if(d.gateway&&d.kind!=='router'&&!d.ports.some(p=>p.ip&&sameSubnet(p.ip,d.gateway,p.prefix)))issues.push({device:d.id,reasonCode:'GATEWAY_OFF_SUBNET',message:d.name+': gateway is outside the configured subnets.'});
  for(const p of d.ports)if(p.ip&&net.devices.some(other=>other.id!==d.id&&other.ports.some(q=>q.ip===p.ip)))issues.push({device:d.id,port:p.name,reasonCode:'DUPLICATE_ADDRESS',message:d.name+': '+p.ip+' is used on another device; isolated networks may reuse addresses.'});
  for(const r of d.routes)if(!d.ports.some(p=>p.enabled&&p.ip&&sameSubnet(p.ip,r.nextHop,p.prefix)))issues.push({device:d.id,reasonCode:'UNREACHABLE_NEXT_HOP',message:d.name+': route next hop '+r.nextHop+' is outside enabled local subnets.'});
 }return issues;}
