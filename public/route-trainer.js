const integer=ip=>{const p=ip.split('.');if(p.length!==4||p.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255))throw Error('Invalid IPv4 address.');return p.reduce((n,x)=>n*256+Number(x),0);};
export function forwardingChoices(destination,routes){
 const host=integer(destination);
 const candidates=routes.filter(r=>{if(!Number.isInteger(r.prefix)||r.prefix<0||r.prefix>32)throw Error('Invalid prefix.');const start=integer(r.network),size=2**(32-r.prefix);if(start%size)throw Error('Unaligned route.');return host>=start&&host<start+size;});
 if(!candidates.length)return [];
 const longest=Math.max(...candidates.map(r=>r.prefix));
 // Input is already the installed routing table, not the routing protocol's candidate database.
 return candidates.filter(r=>r.prefix===longest);
}
export const routeCases=[
{id:'specific',destination:'10.20.30.40',routes:[['0.0.0.0',0,'192.0.2.1','S',1],['10.0.0.0',8,'192.0.2.2','S',1],['10.20.30.0',24,'192.0.2.3','O',110]],why:'The /24 matches more destination bits. The default route’s lower administrative distance does not override a more specific installed prefix.'},
{id:'host',destination:'192.168.5.70',routes:[['192.168.5.0',24,'10.0.0.1','O',110],['192.168.5.64',26,'10.0.0.2','S',1],['192.168.5.70',32,'10.0.0.3','S',5]],why:'The host route matches all 32 bits. Prefix length is the forwarding comparison among these installed routes.'},
{id:'default',destination:'203.0.113.9',routes:[['0.0.0.0',0,'192.0.2.254','S',1],['10.0.0.0',8,'192.0.2.2','O',110]],why:'Only the default route matches. A destination need not have its own more-specific entry to be reachable through a configured default.'},
{id:'drop',destination:'172.16.8.10',routes:[['10.0.0.0',8,'192.0.2.1','S',1],['172.16.9.0',24,'192.0.2.2','S',1]],why:'Neither route contains the destination, and there is no default. This table supplies no forwarding path.'},
{id:'boundary',destination:'172.16.8.128',routes:[['0.0.0.0',0,'192.0.2.1','S',1],['172.16.8.0',25,'192.0.2.2','O',110],['172.16.8.128',25,'192.0.2.3','O',110]],why:'A /25 splits the last octet at 128. This destination belongs to the second block, not the .0/25 block.'},
{id:'equal',destination:'10.1.2.3',routes:[['10.1.2.0',24,'192.0.2.1','O',110],['10.1.2.0',24,'192.0.2.2','O',110],['10.1.0.0',16,'192.0.2.3','S',1]],why:'Both installed /24 paths are eligible. The actual load-sharing choice depends on the forwarding implementation; the /16 is less specific.'}
].map(c=>({...c,routes:c.routes.map(([network,prefix,nextHop,code,ad])=>({network,prefix,nextHop,code,ad}))}));
