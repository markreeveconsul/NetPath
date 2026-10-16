import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {makeAttempt,scoreExam,publicAttempt,certificate,examStore,examTypes,difficulties,validateArchive} from './practitioner.mjs';
import {simpleLessons,simpleMarkup} from './public/simple-lessons.js';
import {lessons} from './public/course.js';
const solved=a=>{a.items.forEach((q,i)=>a.answers[i]=q.correct);return a;};
test('simplified reading covers every lesson without changing lesson identifiers',()=>{
 assert.deepEqual(Object.keys(simpleLessons).sort(),lessons.map(l=>l.id).sort());
 for(const l of lessons)assert.ok(simpleMarkup(l.id).length>100);
});
test('all exam configurations draw unique scoped questions and six constructed responses',()=>{
 for(const t of examTypes)for(const [d,s] of Object.entries(difficulties))for(const timed of [false,true]){
  const a=makeAttempt(t.id,d,timed,'Learner');
  assert.equal(a.items.length,s.count+6);assert.equal(new Set(a.items.map(q=>q.id)).size,a.items.length);
  assert.equal(a.items.filter(q=>q.practical).length,6);assert.ok(a.items.every(q=>t.domains.includes(q.domain)));
  assert.equal(a.deadline,timed?a.started+s.minutes*60000:null);validateArchive([a]);
  assert.equal(scoreExam(solved(a)).passed,true);
  const p=publicAttempt(a);assert.equal(p.result,null);assert.ok(p.items.every(q=>!('correct' in q)&&!('explanation' in q)));
 }
 assert.throws(()=>makeAttempt('bad','core',true,'Learner'));
});
test('overall score, topic floors and practical minimum are independent gates',()=>{
 const a=solved(makeAttempt('comprehensive','core',false,'Learner'));
 const practical=a.items.map((q,i)=>q.practical?i:-1).filter(i=>i>=0);
 delete a.answers[practical[0]];delete a.answers[practical[1]];
 assert.ok(scoreExam(a).percent>=80);assert.equal(scoreExam(a).practical,4);assert.equal(scoreExam(a).passed,false);
 solved(a);a.items.forEach((q,i)=>{if(q.domain==='5')delete a.answers[i];});
 assert.ok(scoreExam(a).percent>=80);assert.equal(scoreExam(a).practical,6);assert.equal(scoreExam(a).passed,false);
 a.answers={};assert.equal(scoreExam(a).percent,0);assert.throws(()=>certificate(a));
 solved(a);a.finished=Date.now();a.name='<Learner & Friend>';assert.match(certificate(a),/&lt;Learner &amp; Friend&gt;/);assert.match(certificate(a),/UNTIMED/);
});
test('timed exams expire without accepting late answers; untimed attempts resume',()=>{
 const db=new DatabaseSync(':memory:'),store=examStore(db);
 const a=makeAttempt('foundations','core',true,'Learner',Date.now()-3600000);store.restore([a]);
 const late=store.answer({id:a.id,index:0,answer:a.items[0].correct});assert.equal(late.finished,a.deadline);assert.deepEqual(late.answers,{});
 assert.equal(store.finish({id:a.id}).finished,a.deadline);assert.throws(()=>store.certificate(a.id));
 const b=store.start({type:'foundations',difficulty:'core',timed:false,name:'Learner'});
 assert.throws(()=>store.start({type:'operations',difficulty:'core',timed:false,name:'Learner'}),/current exam/);
 store.answer({id:b.id,index:0,answer:store.archive().find(x=>x.id===b.id).items[0].correct});
 assert.equal(examStore(db).status().attempts.find(x=>x.id===b.id).finished,null);
 assert.throws(()=>validateArchive([{...a,deadline:0}]));db.close();
});
test('API persists attempts, rejects untrusted scores and round-trips exam backups',async()=>{
 const data=mkdtempSync(path.join(tmpdir(),'netpath-exam-test-'));let proc,base,token;
 const start=async()=>{proc=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:'0',NETPATH_DATA:data},stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('startup timeout')),10000);proc.stdout.on('data',d=>{const m=String(d).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timeout);resolve(m[0]);}});proc.on('error',reject);});token=(await get('/api/state')).token;};
 const stop=async()=>{const end=once(proc,'exit');proc.kill();await end;};
 const get=url=>fetch(base+url).then(r=>r.json());
 const post=(url,p,t=token)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json','X-NetPath-Token':t},body:JSON.stringify(p)});
 try{
  await start();assert.equal((await post('/api/practitioner/start',{},'invalid')).status,403);
  const a=await (await post('/api/practitioner/start',{type:'foundations',difficulty:'applied',timed:false,name:'Test Learner'})).json();
  assert.ok(a.id);assert.equal(a.result,null);await stop();await start();
  assert.equal((await get('/api/practitioner')).attempts[0].id,a.id);
  const failed=await (await post('/api/practitioner/finish',{id:a.id,result:{passed:true,percent:100}})).json();assert.equal(failed.result.passed,false);
  assert.equal((await fetch(base+'/api/practitioner/certificate/'+a.id)).status,400);
  const exported=await get('/api/export');assert.equal(exported.practitionerArchive.length,1);
  const winner=solved(makeAttempt('comprehensive','challenge',false,'QA Learner'));winner.finished=Date.now();
  exported.practitionerArchive.push(winner);assert.equal((await post('/api/restore',exported)).status,200);
  assert.equal((await fetch(base+'/api/practitioner/certificate/'+winner.id)).status,200);
  const legacy=(await get('/api/state')).state;legacy.settings.simpleLessons=true;assert.equal((await post('/api/restore',legacy)).status,200);
  assert.equal((await get('/api/export')).practitionerArchive.length,2);
  const bad=structuredClone(exported);bad.practitionerArchive[0].items=[];assert.equal((await post('/api/restore',bad)).status,400);
  assert.equal((await get('/api/practitioner')).attempts.length,2);assert.equal((await get('/api/state')).state.settings.simpleLessons,true);
 }finally{if(proc&&!proc.killed)await stop();}
});

