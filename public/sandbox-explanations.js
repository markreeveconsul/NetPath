const messages={
 DEVICE_OFF:'Device is powered off.',SOURCE_UNCONFIGURED:'Source is off or has no enabled IPv4 interface.',
 ECHO_RECEIVED:'Destination interface received the IPv4 echo packet.',TTL_DECREMENT:'Router decremented the packet TTL before forwarding.',TTL_EXPIRED:'TTL expired at this router. Check for a routing loop.',
 NO_ROUTE:'No matching route or default gateway.',NEXT_HOP_OFF_SUBNET:'The next hop is not on an enabled, configured local interface.',NEXT_HOP_SELF:'The next hop points to this interface itself.',
 HOST_CANNOT_FORWARD:'A host cannot forward traffic as a router.',DUPLICATE_IP:'Detected duplicate next-hop addresses on this LAN.',ARP_NO_REPLY:'No ARP response. Check cables, power, ports, access VLANs, and neighbor addressing.',
 ASYMMETRIC_SUBNET:'Asymmetric interface subnets; check both masks.',FRAME_UNDELIVERED:'The Ethernet frame could not reach its learned destination.',EVENT_LIMIT:'Simulation event limit reached.',
 ARP_EXPIRED:'ARP cache entry expired.',MAC_EXPIRED:'Switch MAC entry expired.',ARP_FLOOD:'Broadcast ARP frame flooded within the access VLAN.',MAC_FLOOD:'Unknown destination MAC: flood within the access VLAN.'
};
export function describeEvent(e){const d=e.details||{};const text=({
 ROUTE_SELECTED:()=>`Selected /${d.prefix} route via ${d.nextHop} on ${d.port}.`,
 ARP_REQUEST:()=>`Broadcast ARP request: who has ${d.ip}?`,ARP_REPLY:()=>`ARP reply learned: ${d.ip} is ${d.mac}.`,ARP_CACHE_HIT:()=>`ARP cache hit: ${d.ip} is ${d.mac}.`,
 MAC_LEARN:()=>`Learned source MAC ${d.mac} on ${d.port}, VLAN ${d.vlan}.`,MAC_FORWARD:()=>`Known destination MAC: forward only through ${d.port}, VLAN ${d.vlan}.`
 }[e.reasonCode]?.()||messages[e.reasonCode]||e.reasonCode);return (e.phase==='reply'?'Reply · ':'')+text;}
export function describeResult(r,trace){if(r.ok)return 'Echo request and reply delivered.';const e=[...trace].reverse().find(e=>e.decision==='drop');return (e?.phase==='reply'?'Request arrived, but reply failed: ':'Request failed: ')+(e?describeEvent({...e,phase:'request'}):r.reasonCode);}
