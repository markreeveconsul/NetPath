import {subnet} from './logic.js';
const number=ip=>ip.split('.').reduce((sum,part)=>sum*256+Number(part),0);
const address=n=>[24,16,8,0].map(bits=>Math.floor(n/2**bits)%256).join('.');
export const examplePlan={network:'192.168.8.0',prefix:24,requirements:'Engineering: 60\nOperations: 28\nGuests: 12'};
export function allocateVlsm(plan){
 if(!plan||typeof plan.network!=='string'||typeof plan.requirements!=='string'||plan.requirements.length>4000)throw Error('Enter a parent network and up to 30 subnet requirements.');
 const parent=subnet(plan.network.trim(),plan.prefix);
 if(number(plan.network.trim())!==number(parent.network))throw Error(`Use the aligned parent network ${parent.network}/${plan.prefix}, not a host address.`);
 const lines=plan.requirements.split(/\r?\n/).filter(line=>line.trim());
 if(!lines.length||lines.length>30)throw Error('Enter between 1 and 30 lines in the form Name: host count.');
 const names=new Set();
 const requests=lines.map((line,index)=>{
  const match=line.match(/^\s*([^:]{1,80}):\s*(\d+)\s*$/);
  if(!match)throw Error(`Line ${index+1}: use Name: host count, for example Engineering: 60.`);
  const name=match[1].trim(),hosts=Number(match[2]);
  if(!name||names.has(name.toLowerCase()))throw Error(`Line ${index+1}: subnet names must be nonempty and unique.`);
  if(!Number.isSafeInteger(hosts)||hosts<1||hosts>2**31-2)throw Error(`Line ${index+1}: enter a positive whole host count that can fit in an IPv4 /1.`);
  names.add(name.toLowerCase());
  const size=2**Math.max(2,Math.ceil(Math.log2(hosts+2)));
  return {name,requested:hosts,size,prefix:32-Math.log2(size)};
 }).sort((a,b)=>b.size-a.size);
 const needed=requests.reduce((sum,r)=>sum+r.size,0);
 if(needed>parent.size)throw Error(`These LANs need ${needed.toLocaleString()} addresses including network/broadcast space; the parent has ${parent.size.toLocaleString()}. Use a larger parent or reduce the requirements.`);
 let cursor=number(parent.network);
 const allocations=requests.map(r=>{const result={...r,...subnet(address(cursor),r.prefix)};cursor+=r.size;return result;});
 const end=number(parent.network)+parent.size,free=[];
 while(cursor<end){let size=2**Math.floor(Math.log2(end-cursor));while(cursor%size!==0)size/=2;free.push({network:address(cursor),prefix:32-Math.log2(size),size});cursor+=size;}
 return {parent,allocations,free,used:needed,remaining:parent.size-needed};
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function vlsmPage(saved){
 const plan=saved||examplePlan;let result=null;try{if(saved)result=allocateVlsm(saved);}catch{}
 return `<section class="card"><span class="eyebrow">DESIGN BEFORE CONFIGURATION</span><h2 class="section">Plan a network that fits.</h2><p class="muted">Allocate different subnet sizes from one parent network. Include gateways, servers, printers, and growth in each host requirement.</p><form id="vlsm-form"><div class="evidence-grid"><div class="field"><label for="vlsm-network">Parent network address</label><input id="vlsm-network" value="${esc(plan.network)}" required></div><div class="field"><label for="vlsm-prefix">Parent prefix</label><select id="vlsm-prefix">${Array.from({length:30},(_,i)=>i+1).map(p=>`<option value="${p}" ${plan.prefix===p?'selected':''}>/${p}</option>`).join('')}</select></div></div><label for="vlsm-requirements">Subnets and required usable addresses · one per line</label><textarea id="vlsm-requirements" maxlength="4000" required spellcheck="false">${esc(plan.requirements)}</textarea><p class="small muted">Format: Engineering: 60. This tool uses conventional LAN subnets (/30 or larger), reserving network and broadcast addresses. It does not allocate special /31 point-to-point links or /32 host routes.</p><button class="primary" type="submit">Calculate & save plan</button><p id="vlsm-message" role="status" class="small muted">${saved?'Your last calculated plan is saved in your database and backups.':'Example values. Calculate to save your own plan.'}</p></form></section><div id="vlsm-result">${result?vlsmResult(result):''}</div>`;
}
export function vlsmResult(result){return `<section class="card section"><div class="row between"><div><span class="eyebrow">ADDRESSING PLAN</span><h2 class="section">${result.parent.network}/${result.parent.prefix}</h2></div><button id="export-vlsm">Download saved plan</button></div><p class="muted small">${result.used.toLocaleString()} of ${result.parent.size.toLocaleString()} total addresses allocated · ${result.remaining.toLocaleString()} unallocated.</p><div class="vlsm-bar" role="img" aria-label="${result.used} addresses allocated and ${result.remaining} free">${result.allocations.map((r,i)=>`<span class="vlsm-block vlsm-color-${i%3}" style="flex:${r.size}" title="${esc(r.name)}: ${r.network}/${r.prefix}"></span>`).join('')}${result.remaining?`<span class="vlsm-free" style="flex:${result.remaining}" title="Unallocated"></span>`:''}</div><div class="table-wrap"><table><thead><tr><th>Subnet</th><th>Needed / usable</th><th>Network</th><th>Mask</th><th>Usable range</th><th>Broadcast</th></tr></thead><tbody>${result.allocations.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.requested} / ${r.hosts}</td><td>${r.network}/${r.prefix}</td><td>${r.mask}</td><td>${r.first} – ${r.last}</td><td>${r.broadcast}</td></tr>`).join('')}</tbody></table></div><h3 class="section">Why these sizes?</h3><ol>${result.allocations.map(r=>`<li class="small"><strong>${esc(r.name)}</strong>: ${r.requested} required + 2 reserved → ${r.size} addresses (2<sup>${32-r.prefix}</sup>) → /${r.prefix}. ${r.hosts-r.requested} usable addresses remain inside this subnet.</li>`).join('')}</ol><h3 class="section">Unallocated address blocks</h3><p>${result.free.length?result.free.map(r=>`<code>${r.network}/${r.prefix}</code>`).join(' · '):'No unallocated addresses remain.'}</p><div class="callout small">Allocate largest blocks first to preserve alignment. A suggested usable range does not configure a gateway: choose and reserve gateway addresses before creating DHCP pools. This is a design tool, not live Packet Tracer validation.</div></section>`;}
export function vlsmText(result){return `NetPath VLSM plan\nParent: ${result.parent.network}/${result.parent.prefix}\nConventional LAN allocation; no /31 or /32 assignments.\n\n`+result.allocations.map(r=>`${r.name}\nRequired: ${r.requested}; usable: ${r.hosts}\nNetwork: ${r.network}/${r.prefix}\nMask: ${r.mask}\nUsable: ${r.first} - ${r.last}\nBroadcast: ${r.broadcast}`).join('\n\n')+`\n\nUnallocated: ${result.free.map(r=>r.network+'/'+r.prefix).join(', ')||'none'}\nChoose and reserve gateway addresses before configuring DHCP.\n`;}
