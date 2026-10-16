const outcomes=['allowed','blocked','inconclusive'];
export function evidenceVerdict(record){return record.observed==='inconclusive'?'Inconclusive':record.expected===record.observed?'Matched expectation':'Unexpected result';}
export function validateEvidence(evidence,labIds){
 if(evidence==null)return;
 if(typeof evidence!=='object'||Array.isArray(evidence))throw Error('Invalid lab evidence.');
 for(const [lab,records] of Object.entries(evidence)){
  if(!labIds.includes(lab)||!Array.isArray(records)||records.length>50)throw Error('Invalid lab evidence collection (maximum 50 tests per lab).');
  const ids=new Set();
  for(const r of records){
   if(!r||typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(r.id)||ids.has(r.id)||typeof r.date!=='string'||!Number.isFinite(Date.parse(r.date)))throw Error('Invalid lab evidence identity or date.');
   ids.add(r.id);
   for(const key of ['source','destination','protocol'])if(typeof r[key]!=='string'||!r[key].trim()||r[key].length>120)throw Error('Enter a source, destination, and protocol (maximum 120 characters each).');
   if(!['allowed','blocked'].includes(r.expected)||!outcomes.includes(r.observed))throw Error('Invalid evidence outcome.');
   if(typeof r.output!=='string'||!r.output.trim()||r.output.length>2000)throw Error('Include observations or command output (maximum 2,000 characters).');
  }
 }
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function evidencePanel(lab,records=[],draft={}){
 const field=(key,label,placeholder)=>`<div class="field"><label for="evidence-${key}">${label}</label><input id="evidence-${key}" name="${key}" value="${esc(draft[key])}" placeholder="${placeholder}" maxlength="120" required></div>`;
 const options=(values,current)=>values.map(([value,label])=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`).join('');
 return `<section class="card section" id="evidence-panel"><div class="row between"><h2>Lab test log</h2><span class="badge">${records.length}/50 recorded</span></div><p class="small muted">Record both permitted and denied test cases. Results are your observations, not automatic Packet Tracer grading. A blocked connection can be the correct result.</p><form id="evidence-form" data-evidence-lab="${lab}"><div class="evidence-grid">${field('source','Source device / address','PC-A · 192.168.10.10')}${field('destination','Destination device / address','PC-B · 192.168.20.10')}${field('protocol','Protocol or test','ICMP ping, TCP/443, SSH…')}<div class="field"><label for="evidence-expected">Expected outcome</label><select id="evidence-expected" name="expected">${options([['allowed','Connection allowed'],['blocked','Connection blocked']],draft.expected||'allowed')}</select></div><div class="field"><label for="evidence-observed">Observed outcome</label><select id="evidence-observed" name="observed">${options([['inconclusive','Not established / inconclusive'],['allowed','Connection allowed'],['blocked','Connection blocked']],draft.observed||'inconclusive')}</select></div></div><label for="evidence-output">What did you observe?</label><textarea id="evidence-output" name="output" maxlength="2000" required placeholder="Paste relevant output and explain the observation. Include device state if a failed ping could have more than one cause.">${esc(draft.output)}</textarea><p class="small muted" id="evidence-draft-status">Unsubmitted drafts stay in this browser. Recorded tests are saved to your NetPath database and backups.</p><button class="primary" type="submit" ${records.length>=50?'disabled':''}>Record test</button> <button type="button" id="export-evidence" data-id="${lab}" ${records.length?'':'disabled'}>Export test log</button></form><div class="section">${records.length?records.slice().reverse().map(r=>`<details class="evidence-record"><summary>${esc(evidenceVerdict(r))} · ${esc(r.protocol)} · ${esc(r.source)} → ${esc(r.destination)}</summary><p class="small muted">${esc(new Date(r.date).toLocaleString())} · Expected: ${esc(r.expected)} · Observed: ${esc(r.observed)}</p><pre>${esc(r.output)}</pre></details>`).join(''):'<p class="muted small">No recorded tests yet. Keep a baseline test before adding a deliberate fault.</p>'}</div></section>`;
}
export function evidenceText(title,records){return `${title}\nSelf-reported Packet Tracer test evidence; not live grading.\n\n`+records.map((r,i)=>`${i+1}. ${evidenceVerdict(r)}\n${r.date}\nSource: ${r.source}\nDestination: ${r.destination}\nProtocol/test: ${r.protocol}\nExpected: ${r.expected}\nObserved: ${r.observed}\nEvidence:\n${r.output}`).join('\n\n');}
