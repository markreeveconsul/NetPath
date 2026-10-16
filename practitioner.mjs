import {lessons} from './public/course.js';
import {examTypes} from './public/certificate-catalog.js';
import {certificateDesign} from './public/certificate-design.js';
import crypto from 'node:crypto';
import {questions} from './public/questions.js';
import {practiceDomain} from './public/assessment.js';
import {subnet} from './public/logic.js';
export {examTypes} from './public/certificate-catalog.js';
export const difficulties={core:{name:'Core',count:12,pass:80,floor:60,minutes:35},applied:{name:'Applied',count:18,pass:85,floor:65,minutes:45},challenge:{name:'Challenge',count:24,pass:90,floor:70,minutes:55}};
export const finalType={id:'readiness',name:'NetPath CCNA Readiness',domains:['1','2','3','4','5']};
export const finalSpec={name:'Final',count:54,pass:90,floor:80,minutes:90};
const specFor=a=>a.type==='readiness'?finalSpec:difficulties[a.difficulty];
export function readiness(completed,attempts){const missingLessons=lessons.filter(l=>!completed.includes(l.id)).map(l=>({id:l.id,title:l.title}));const missingExams=examTypes.filter(t=>!attempts.some(a=>a.type===t.id&&a.difficulty==='challenge'&&a.finished&&scoreExam(a).passed)).map(t=>({id:t.id,title:t.name}));return {unlocked:!missingLessons.length&&!missingExams.length,missingLessons,missingExams,totalLessons:lessons.length,totalExams:examTypes.length};}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const clean=x=>String(x??'').trim().toLowerCase().replace(/\s+/g,' ');
export function scoreExam(attempt){
 const spec=specFor(attempt),byDomain={};let correct=0,practical=0;
 const review=attempt.items.map((item,i)=>{const answer=attempt.answers[i],ok=item.options?answer===item.correct:clean(answer)===clean(item.correct);if(ok)correct++;if(item.practical&&ok)practical++;const d=byDomain[item.domain]??={correct:0,total:0};d.total++;if(ok)d.correct++;return {prompt:item.prompt,answer:answer??'',expected:item.options?item.options[item.correct]:item.correct,correct:ok,explanation:item.explanation};});
 const percent=Math.floor(correct/attempt.items.length*100),domainPass=Object.values(byDomain).every(d=>d.correct/d.total*100>=spec.floor);
 return {correct,total:attempt.items.length,percent,practical,practicalTotal:6,byDomain,passed:percent>=spec.pass&&domainPass&&practical>=5,review};
}
function numericalItems(difficulty){
 const range=difficulty==='core'?[24,25,26]:difficulty==='applied'?[25,26,27,28]:[20,22,27,28,29,30];
 return Array.from({length:6},(_,i)=>{const prefix=range[crypto.randomInt(range.length)],ip=`172.${16+crypto.randomInt(16)}.${crypto.randomInt(256)}.${1+crypto.randomInt(253)}`,r=subnet(ip,prefix),kind=i%3,key=['network','broadcast','hosts'][kind];return {id:crypto.randomUUID(),domain:'1',practical:true,prompt:`${['Give the network address','Give the broadcast address','Give the number of usable host addresses'][kind]} for ${ip}/${prefix}. ${kind===2?'Enter digits only.':'Enter a dotted IPv4 address.'}`,correct:String(r[key]),explanation:`${ip}/${prefix} belongs to ${r.network}/${prefix}; broadcast ${r.broadcast}; ${r.hosts} ordinary usable host addresses.`};});
}
function operationalItems(difficulty){
 return Array.from({length:6},(_,i)=>{
  const n=crypto.randomInt(10,200),p=difficulty==='core'?24:difficulty==='applied'?26:28,host=1+crypto.randomInt(2**(32-p)-2),base=crypto.randomInt(256/(2**(32-p)))*(2**(32-p));
  const hops=shuffle([`192.0.2.${1+crypto.randomInt(80)}`,`192.0.2.${81+crypto.randomInt(80)}`,`192.0.2.${161+crypto.randomInt(80)}`]),specific=crypto.randomInt(2)===0;
  if(i%2===0)return {id:crypto.randomUUID(),domain:'3',practical:true,prompt:`Installed routes: 10.0.0.0/8 via ${hops[0]} (AD 1); 10.${n}.5.${base}/${p} via ${hops[1]} (AD 110); default via ${hops[2]}. Which next-hop IPv4 address is eligible for 10.${n}.${specific?5:6}.${base+host}? Enter only the next-hop address.`,correct:hops[specific?1:0],explanation:specific?'The more specific matching installed prefix wins; a lower AD on the less specific route does not override it.':'The destination does not match the subnet route. The matching /8 wins over the default route.'};
  const permitFirst=crypto.randomInt(2)===0,entries=permitFirst?`10 permit ip host 192.168.${n}.${host} any; 20 deny ip 192.168.${n}.0 0.0.0.255 any`:`10 deny ip 192.168.${n}.0 0.0.0.255 any; 20 permit ip host 192.168.${n}.${host} any`;
  return {id:crypto.randomUUID(),domain:'4',practical:true,prompt:`An ACL has these entries in order: ${entries}; 30 permit ip any any. What happens to a packet sourced by 192.168.${n}.${host}? Enter permit or deny.`,correct:permitFirst?'permit':'deny',explanation:'ACLs stop at the first matching entry. Here the '+(permitFirst?'host permit':'subnet deny')+' matches first.'};
 });
}
export function makeAttempt(type,difficulty,timed,name,now=Date.now()){
 if(type==='readiness'){if(difficulty!=='challenge')throw Error('The final exam requires Challenge prerequisites.');return makeFinal(timed,name,now);}
 const t=examTypes.find(t=>t.id===type),s=difficulties[difficulty];if(!t||!s||typeof timed!=='boolean'||typeof name!=='string'||!name.trim()||name.length>80)throw Error('Choose a valid exam, difficulty, timing mode, and learner name.');
 const pool=shuffle(questions.filter(q=>t.domains.includes(practiceDomain(q))&&(!t.module||q.module===t.module)));
 // Higher difficulty prioritizes the scenario bank over direct lesson recall.
 if(difficulty!=='core')pool.sort((a,b)=>Number(!a.qid.includes('advanced'))-Number(!b.qid.includes('advanced')));
 const selected=[];for(let i=0;selected.length<s.count;i++){const d=t.domains[i%t.domains.length],q=pool.find(q=>practiceDomain(q)===d&&!selected.includes(q));if(q)selected.push(q);if(i>pool.length*t.domains.length)throw Error('Insufficient questions for this exam.');}
 const mc=selected.map(q=>{const order=shuffle(q.question.options.map((text,i)=>({text,right:i===q.question.answer})));return {id:q.qid,domain:practiceDomain(q),prompt:q.question.prompt,options:order.map(x=>x.text),correct:order.findIndex(x=>x.right),explanation:q.question.explanation};});
 const practical=['foundations','addressing'].includes(type)?numericalItems(difficulty):type==='switching'?switchingItems(difficulty):type==='routing'?Array.from({length:3},()=>operationalItems(difficulty).filter(q=>q.domain==='3')).flat().slice(0,6):type==='security'?Array.from({length:3},()=>operationalItems(difficulty).filter(q=>q.domain==='4')).flat().slice(0,6):type==='operations'?operationalItems(difficulty):[...numericalItems(difficulty).slice(0,3),...operationalItems(difficulty).slice(0,3)];
 return {id:crypto.randomUUID(),type,difficulty,timed,name:name.trim(),started:now,deadline:timed?now+s.minutes*60000:null,finished:null,items:shuffle([...mc,...practical]),answers:{},index:0};
}
export function publicAttempt(a){if(!a)return null;const {items,...rest}=a;return {...rest,items:items.map(({correct,explanation,...item})=>item),result:a.finished?scoreExam(a):null};}
export function certificate(a){const r=scoreExam(a);if(!a.finished||!r.passed)throw Error('A passing completed attempt is required.');return certificateDesign({name:a.name,track:[...examTypes,finalType].find(t=>t.id===a.type).name,level:specFor(a).name,score:r.percent,timed:a.timed,date:new Date(a.finished).toISOString().slice(0,10),id:a.id});}
export function examStore(db,getCompleted=()=>[]){
 db.exec('CREATE TABLE IF NOT EXISTS practitioner (id TEXT PRIMARY KEY,value TEXT NOT NULL)');
 const all=()=>db.prepare('SELECT value FROM practitioner ORDER BY rowid DESC').all().map(r=>JSON.parse(r.value));
 const write=a=>db.prepare('INSERT OR REPLACE INTO practitioner(id,value) VALUES(?,?)').run(a.id,JSON.stringify(a));
 const find=id=>{const r=db.prepare('SELECT value FROM practitioner WHERE id=?').get(id);if(!r)throw Error('Exam attempt not found.');return JSON.parse(r.value);};
 const expire=a=>{if(!a.finished&&a.deadline&&Date.now()>=a.deadline){a.finished=a.deadline;write(a);}return a;};
 return {archive:all,validateArchive,restore:rows=>{validateArchive(rows);db.exec('DELETE FROM practitioner');for(const a of rows)write(a);},status:()=>({types:[...examTypes,finalType],difficulties,finalSpec,readiness:readiness(getCompleted(),all()),attempts:all().map(a=>publicAttempt(expire(a)))}),start:p=>{if(p.type==='readiness'&&!readiness(getCompleted(),all()).unlocked)throw Error('Final exam locked: complete every lesson and pass all seven Challenge exams.');if(all().some(a=>!expire(a).finished))throw Error('Finish the current exam before starting another.');const a=makeAttempt(p.type,p.difficulty,p.timed,p.name);write(a);return publicAttempt(a);},answer:p=>{const a=expire(find(p.id));if(a.finished)return publicAttempt(a);if(!Number.isInteger(p.index)||p.index<0||p.index>=a.items.length)throw Error('Invalid question index.');const item=a.items[p.index];if(item.options?(!Number.isInteger(p.answer)||p.answer<0||p.answer>=item.options.length):(typeof p.answer!=='string'||p.answer.length>120))throw Error('Invalid answer.');a.answers[p.index]=p.answer;a.index=p.index;write(a);return publicAttempt(a);},finish:p=>{const a=expire(find(p.id));if(!a.finished){a.finished=Date.now();write(a);}return publicAttempt(a);},certificate:id=>certificate(find(id))};
}
export function validateArchive(rows){
 if(!Array.isArray(rows)||rows.length>1000)throw Error('Invalid practitioner archive.');
 const ids=new Set();let active=0;
 for(const a of rows){const s=a?specFor(a):null;if(!s||(a.type==='readiness'&&a.difficulty!=='challenge')||![...examTypes,finalType].some(t=>t.id===a.type)||!/^[-a-f0-9]{36}$/.test(a.id)||ids.has(a.id)||typeof a.name!=='string'||a.name.length>80||typeof a.timed!=='boolean'||!Number.isFinite(a.started)||a.started<0||a.deadline!==(a.timed?a.started+s.minutes*60000:null)||(a.finished!==null&&(!Number.isFinite(a.finished)||a.finished<a.started))||!Array.isArray(a.items)||a.items.length!==s.count+6||!a.answers||typeof a.answers!=='object'||Array.isArray(a.answers)||!Number.isInteger(a.index)||a.index<0||a.index>=a.items.length)throw Error('Invalid practitioner attempt.');ids.add(a.id);if(a.finished===null)active++;
  if(a.items.filter(i=>i.practical).length!==6)throw Error('Invalid practical questions.');
  for(const i of a.items){if(!['1','2','3','4','5'].includes(i.domain)||typeof i.prompt!=='string'||i.prompt.length>3000||typeof i.explanation!=='string'||i.explanation.length>3000||(i.options?(!Array.isArray(i.options)||i.options.length!==3||i.options.some(x=>typeof x!=='string'||x.length>2000)||!Number.isInteger(i.correct)||i.correct<0||i.correct>2):(typeof i.correct!=='string'||i.correct.length>120)))throw Error('Invalid archived question.');}
  for(const [k,v] of Object.entries(a.answers)){const i=a.items[k];if(!/^\d+$/.test(k)||!i||(i.options?(!Number.isInteger(v)||v<0||v>2):(typeof v!=='string'||v.length>120)))throw Error('Invalid archived answer.');}
 }
 if(active>1)throw Error('Archive contains multiple unfinished exams.');
}

function switchingItems(difficulty){return Array.from({length:6},(_,i)=>{const vlan=10+crypto.randomInt(80),allowed=crypto.randomInt(2)===0,blocked=difficulty==='challenge'&&crypto.randomInt(2)===0;return {id:crypto.randomUUID(),domain:'2',practical:true,prompt:i%2===0?'An untagged frame enters an access port assigned to VLAN '+vlan+'. Which VLAN owns the frame? Enter the VLAN number.':'A tagged VLAN '+vlan+' frame must cross a trunk. Its allowed VLAN list is '+(allowed?vlan+", "+(vlan+1):String(vlan+1))+'. The VLAN exists on both switches and this trunk is '+(blocked?'blocking':'forwarding')+' for that VLAN under STP. Can this trunk forward the frame? Enter forward or drop.',correct:i%2===0?String(vlan):allowed&&!blocked?'forward':'drop',explanation:i%2===0?'Untagged access ingress uses the configured access VLAN.':'The VLAN must be allowed and the port must be forwarding for it.'};});}

function makeFinal(timed,name,now){
 const base=makeAttempt('comprehensive','challenge',timed,name,now),selected=[];
 for(const lesson of lessons){const pool=questions.filter(q=>q.id===lesson.id);if(!pool.length)throw Error('A lesson has no exam questions.');selected.push(shuffle(pool)[0]);}
 if(selected.length>finalSpec.count)throw Error('Final exam capacity must be updated for the expanded curriculum.');
 selected.push(...shuffle(questions.filter(q=>!selected.includes(q))).slice(0,finalSpec.count-selected.length));
 const mc=selected.map(q=>{const options=shuffle(q.question.options.map((text,i)=>({text,right:i===q.question.answer})));return {id:q.qid,lesson:q.id,domain:practiceDomain(q),prompt:q.question.prompt,options:options.map(x=>x.text),correct:options.findIndex(x=>x.right),explanation:q.question.explanation};});
 const practical=[...numericalItems('challenge').slice(0,2),...switchingItems('challenge').slice(0,2),...operationalItems('challenge').slice(0,2)];
 return {...base,type:'readiness',deadline:timed?now+finalSpec.minutes*60000:null,items:shuffle([...mc,...practical])};
}
