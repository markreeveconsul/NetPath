export const jobs=[
 {id:'gateway',title:'The printer works. Attendance is offline.',brief:'A replacement office PC was configured this morning. Restore access to the attendance server without disrupting printing.',lesson:'subnetting',hint:'The PC is 192.168.10.70/26. Its local block is .64–.127. Compare the default gateway with the router interface.'},
 {id:'vlan',title:'A desk move broke both connections.',brief:'The office PC was moved to switch port Fa0/3. The printer and router still use VLAN 20. Restore the PC’s connectivity.',lesson:'vlan',hint:'Check the access VLAN on Fa0/3. The printer and router belong to VLAN 20; an IP address does not override VLAN membership.'},
 {id:'policy',title:'A new rule blocks the office.',brief:'Printing still works after a policy change, but attendance is unreachable. Restore the permitted office-to-server flow.',lesson:'acl',hint:'Trace a server packet. If it reaches the router, inspect the access policy before changing the addressing.'}
];
export const baseline={gateway:'192.168.10.65',vlan:20,serverPolicy:'permit'};
export function freshJob(id){if(!jobs.some(j=>j.id===id))throw Error('Unknown job.');return {config:{...baseline,...(id==='gateway'?{gateway:'192.168.10.1'}:id==='vlan'?{vlan:10}:{serverPolicy:'deny'})},checks:{printer:false,server:false},log:['Office PC: 192.168.10.70/26. Type help for commands.'],closed:false};}
export function probe(config,target){
 const path=['pc','switch'];
 if(config.vlan!==20)return {ok:false,path,stop:'switch',message:`Fa0/3 assigns the PC to VLAN ${config.vlan}. The printer and router are in VLAN 20. The traffic cannot reach them through this switch configuration.`};
 if(target==='printer')return {ok:true,path:[...path,'printer'],message:'4 replies from 192.168.10.90. Local printing is reachable.'};
 if(config.gateway!=='192.168.10.65')return {ok:false,path:['pc'],stop:'pc',message:`The configured gateway ${config.gateway} is not the office router at 192.168.10.65. The PC cannot send this remote packet along the required path.`};
 path.push('router');if(config.serverPolicy==='deny')return {ok:false,path,stop:'router',message:'The office-to-attendance policy denies the packet at the router. No reply from 192.168.20.10.'};
 return {ok:true,path:[...path,'server'],message:'4 replies from 192.168.20.10. Server IP reachability verified; this ping does not test the web application.'};
}
export function command(record,input){const c=input.trim().toLowerCase().replace(/\s+/g,' '),cfg=record.config;
 if(c==='help')return {text:'Supported: ipconfig · ping 192.168.10.90 · ping 192.168.20.10 · show vlan brief · show access-lists\nConfiguration changes are made in the selected device panel.'};
 if(c==='ipconfig')return {text:`IPv4 address: 192.168.10.70\nMask: 255.255.255.192 (/26)\nDefault gateway: ${cfg.gateway}`};
 if(c==='show vlan brief')return {text:`VLAN ${cfg.vlan}: Fa0/3 (office PC)\nVLAN 20: Fa0/4 (printer), Gi0/1 (router)\nAll physical links: up`};
 if(c==='show access-lists')return {text:`Office policy, inbound on router office interface:\n10 ${cfg.serverPolicy} ip 192.168.10.64 0.0.0.63 host 192.168.20.10\n20 permit ip any any`};
 const target=c==='ping 192.168.10.90'?'printer':c==='ping 192.168.20.10'?'server':null;
 if(target){const result=probe(cfg,target);return {text:result.message,target,result};}
 return {text:'Command not supported in this training model. Type help.'};
}
export function validateField(data){if(data===undefined)return;if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid field lab save.');for(const [id,r] of Object.entries(data)){
 if(r?.hintLevel!==undefined&&(!Number.isInteger(r.hintLevel)||r.hintLevel<0||r.hintLevel>3))throw Error('Invalid hint level.');
 if(r?.reflection!==undefined&&(!Number.isInteger(r.reflection)||r.reflection<0||r.reflection>2||!r.closed))throw Error('Invalid mission reflection.');
 if(!jobs.some(j=>j.id===id)||!r||!r.config||!r.checks||!Array.isArray(r.log)||r.log.length>40||r.log.some(x=>typeof x!=='string'||x.length>2000)||typeof r.closed!=='boolean')throw Error('Invalid field job.');
 const c=r.config;if(typeof c.gateway!=='string'||!/^\d{1,3}(\.\d{1,3}){3}$/.test(c.gateway)||c.gateway.split('.').some(n=>Number(n)>255)||!Number.isInteger(c.vlan)||c.vlan<1||c.vlan>4094||!['permit','deny'].includes(c.serverPolicy))throw Error('Invalid device configuration.');
 for(const target of ['printer','server'])if(typeof r.checks[target]!=='boolean'||r.checks[target]&&!probe(c,target).ok)throw Error('Checks do not match the current configuration.');
 if(r.closed&&(!r.checks.printer||!r.checks.server))throw Error('Verify both services before closing the job.');
}}

