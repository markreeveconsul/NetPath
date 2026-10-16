import {freshJob} from './public/field-engine.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {subnet,nextReview,createTerminal,terminalCommand} from './public/logic.js';
import {lessons,modules} from './public/course.js';
import {labs} from './public/labs.js';
import {questions} from './public/questions.js';
import {objectives,glossary} from './public/coverage.js';
import {topologies,topologyText} from './public/topologies.js';
import {validateEvidence,evidenceVerdict,evidenceText,evidencePanel} from './public/evidence.js';
import {workshops} from './public/workshops.js';
import {selectPractice} from './public/assessment.js';
import {allocateVlsm,examplePlan,vlsmText} from './public/vlsm.js';
import {v2Domains,v2Objectives,v2CoverageMarkup} from './public/coverage-v2.js';

test('lesson numbering and navigation follow the displayed module order',()=>{
 const displayed=modules.flatMap(m=>lessons.filter(l=>l.module===m.id));
 assert.deepEqual(displayed.map(l=>l.id),lessons.map(l=>l.id));
 assert.deepEqual(displayed.map(l=>l.number),Array.from({length:lessons.length},(_,i)=>i+1));
 for(let i=0;i<displayed.length;i++){
  const lesson=displayed[i];
  assert.equal(lessons[lesson.number-2]?.id,displayed[i-1]?.id);
  assert.equal(lessons[lesson.number]?.id,displayed[i+1]?.id);
 }
 assert.ok(lessons.find(l=>l.id==='ospfv3').number<lessons.find(l=>l.id==='dhcp-dns').number);
 assert.equal(lessons.at(-1).id,'capstone');
});

test('future exam map exposes gaps and links to existing study material',()=>{
 assert.equal(v2Objectives.length,29);
 assert.equal(new Set(v2Objectives.map(o=>o.id)).size,29);
 assert.equal(v2Domains.reduce((sum,d)=>sum+d[2],0),100);
 for(const o of v2Objectives){
  assert.ok(lessons.some(l=>l.id===o.lesson),o.id);
  assert.ok(o.gap.length>20,o.id);
  for(const id of o.labs)assert.ok(labs.some(l=>l.id===id),id);
 }
 const html=v2CoverageMarkup(lessons,labs,['static']);
 assert.equal((html.match(/Partial coverage/g)||[]).length,29);
 assert.match(html,/Lesson studied/);
 assert.match(html,/#lab\/ipv6-routing/);
});

test('VLSM allocates aligned largest-first LANs and describes all remaining space',()=>{
 const r=allocateVlsm(examplePlan);
 assert.deepEqual(r.allocations.map(a=>[a.network,a.prefix,a.hosts]),[['192.168.8.0',26,62],['192.168.8.64',27,30],['192.168.8.96',28,14]]);
 assert.deepEqual(r.free.map(a=>[a.network,a.prefix]),[['192.168.8.112',28],['192.168.8.128',25]]);
 assert.equal(r.used+r.remaining,256);
 assert.match(vlsmText(r),/192.168.8.96\/28/);
 const high=allocateVlsm({network:'255.255.255.252',prefix:30,requirements:'Point: 2'});
 assert.equal(high.allocations[0].broadcast,'255.255.255.255');assert.equal(high.free.length,0);
 const large=allocateVlsm({network:'128.0.0.0',prefix:1,requirements:'Large: 2147483646'});
 assert.equal(large.allocations[0].prefix,1);assert.equal(large.remaining,0);
 const sorted=allocateVlsm({...examplePlan,requirements:'Small: 2\nLarge: 100'});
 assert.equal(sorted.allocations[0].name,'Large');assert.equal(sorted.allocations[1].network,'192.168.8.128');
});
test('VLSM rejects oversized, misaligned, malformed, and duplicate requirements',()=>{
 for(const plan of [{...examplePlan,network:'192.168.8.1'},{...examplePlan,requirements:'Too big: 255'},{...examplePlan,requirements:'Zero: 0'},{...examplePlan,requirements:'A: 1.5'},{...examplePlan,requirements:'A: 10\na: 20'},{...examplePlan,prefix:31},{...examplePlan,requirements:'Bad line'},{...examplePlan,requirements:'X: 9007199254740992'}])assert.throws(()=>allocateVlsm(plan));
});

test('focused assessments avoid duplicate questions and prefer unseen or recently missed topics',()=>{
 const first=questions[0],seen=questions.slice(0,20).map(q=>({lesson:q.id,qid:q.qid,score:1,total:1}));
 const selected=selectPractice(questions,60,'all',seen);
 assert.equal(new Set(selected.map(q=>q.qid)).size,60);
 assert.ok(selected.every(q=>!seen.some(a=>a.qid===q.qid)));
 const focus=selectPractice(questions,10,'addressing');assert.ok(focus.every(q=>q.module==='addressing'));
 const weak=selectPractice(questions,10,'weak',[{lesson:first.id,score:0,total:1}]);
 assert.ok(weak.slice(0,5).every(q=>q.id===first.id));
 assert.throws(()=>selectPractice(questions,60,'addressing'),/shorter session/);
});

test('workshop lessons preserve IDs and include worked instruction and independent tasks',()=>{
 assert.deepEqual(Object.keys(workshops).sort(),lessons.filter(l=>Object.hasOwn(workshops,l.id)).map(l=>l.id).sort());
 for(const lesson of lessons){assert.equal(lesson.sections.length,5);assert.ok(lesson.workshop.task);assert.ok(lesson.workshop.answer);}
});
test('evidence distinguishes expected denials, failures, and uncertainty; rejects malformed records',()=>{
 const record={id:'test-1',date:'2026-09-22T03:00:00.000Z',source:'PC-A',destination:'PC-B',protocol:'ICMP',expected:'blocked',observed:'blocked',output:'Request timed out; ACL counter increased.'};
 validateEvidence({'acl-lab':[record]},labs.map(l=>l.id));
 assert.equal(evidenceVerdict(record),'Matched expectation');
 assert.equal(evidenceVerdict({...record,observed:'allowed'}),'Unexpected result');
 assert.equal(evidenceVerdict({...record,observed:'inconclusive'}),'Inconclusive');
 for(const bad of [{...record,output:''},{...record,date:'invalid'},{...record,expected:'inconclusive'},{...record,output:'x'.repeat(2001)}])assert.throws(()=>validateEvidence({'acl-lab':[bad]},labs.map(l=>l.id)));
 assert.throws(()=>validateEvidence({'unknown':[record]},labs.map(l=>l.id)));
 assert.throws(()=>validateEvidence({'acl-lab':[record,record]},labs.map(l=>l.id)));
 assert.match(evidenceText('ACL test',[record]),/Expected: blocked/);
 assert.match(evidencePanel('acl-lab',[{...record,output:'<script>alert(1)</script>'}]),/&lt;script&gt;/);
});

test('every lab has connected wiring with unique physical port assignments',()=>{
 assert.deepEqual(Object.keys(topologies).sort(),labs.map(l=>l.id).sort());
 for(const lab of labs){
  const t=topologies[lab.id],ids=t.nodes.map(n=>n.id),used=new Set(),reached=new Set([ids[0]]);
  assert.equal(new Set(ids).size,ids.length,lab.id);
  for(const l of t.links){
   assert.ok(ids.includes(l.a)&&ids.includes(l.b)&&l.a!==l.b,lab.id);
   for(const [device,port] of [[l.a,l.ap],[l.b,l.bp]]){const key=device+':'+port;assert.ok(!used.has(key),lab.id+' duplicate '+key);used.add(key);}
  }
  for(let i=0;i<ids.length;i++)for(const l of t.links)if(reached.has(l.a)||reached.has(l.b)){reached.add(l.a);reached.add(l.b);}
  assert.equal(reached.size,ids.length,lab.id+' disconnected device');
  assert.ok(topologyText(lab.id).includes(t.links[0].ap));
 }
 assert.equal(topologies['stp-triangle'].links.length,3);
 assert.equal(topologies['lacp-lab'].links.filter(l=>l.a==='S1'&&l.b==='S2').length,2);
 assert.equal(topologies['acl-lab'].nodes.filter(n=>n.kind==='1941').length,2);
});
test('subnet boundaries across octets and at /30',()=>{assert.deepEqual(subnet('192.168.8.77',26),{network:'192.168.8.64',broadcast:'192.168.8.127',first:'192.168.8.65',last:'192.168.8.126',hosts:62,mask:'255.255.255.192',size:64,prefix:26});assert.equal(subnet('172.16.31.250',20).network,'172.16.16.0');assert.equal(subnet('172.16.31.250',20).broadcast,'172.16.31.255');assert.equal(subnet('10.0.0.6',30).hosts,2);assert.equal(subnet('200.1.1.1',1).broadcast,'255.255.255.255');assert.throws(()=>subnet('256.1.1.1',24));assert.throws(()=>subnet('1.2.3.4',31));});
test('spaced review returns failed cards quickly and expands good intervals',()=>{assert.equal(nextReview(null,'again',0).due,600000);assert.equal(nextReview(null,'hard',0).due,86400000);assert.equal(nextReview({interval:4},'good',0).interval,10);});
test('command practice enforces modes and checks actual VLAN configuration',()=>{const t=createTerminal();assert.match(terminalCommand(t,'vlan 10').out,/Unsupported/);for(const c of ['enable','conf t','vlan 10','name ENGINEERING','exit','interface fa0/1','switchport mode access','switchport access vlan 10','end'])terminalCommand(t,c);assert.equal(t.vlans[10],'ENGINEERING');assert.equal(t.interfaces['fastethernet0/1'].vlan,10);assert.equal(t.interfaces['fastethernet0/1'].mode,'access');assert.match(terminalCommand(t,'show vlan brief').out,/ENGINEERING/);assert.equal(t.interfaces['fastethernet0/2'].vlan,1);});
test('curriculum and lab links are coherent',()=>{assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);for(const l of lessons){assert.ok(modules.some(m=>m.id===l.module));assert.ok(l.question.options[l.question.answer]);assert.ok(l.sections.every(s=>s.text.length>100));}for(const l of labs){assert.ok(lessons.some(x=>x.id===l.lesson));assert.ok(l.steps.length>=4);}});
test('question bank and objective map preserve stable references',()=>{assert.equal(questions.length,181);assert.equal(new Set(questions.map(q=>q.qid)).size,181);for(const q of questions){assert.equal(q.question.options.length,3);assert.ok(q.question.options[q.question.answer]);assert.ok(lessons.some(l=>l.id===q.id));}assert.equal(objectives.length,53);assert.equal(new Set(objectives.map(o=>o.id)).size,53);for(const o of objectives)assert.ok(lessons.some(l=>l.id===o.lesson));for(const [, ,id] of glossary)assert.ok(lessons.some(l=>l.id===id));});
test('database survives restart; export and restore; invalid and stale writes rejected',async()=>{const data=mkdtempSync(path.join(tmpdir(),'netpath-test-'));let proc,base;async function start(){proc=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:'0',NETPATH_DATA:data},stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);proc.stdout.on('data',d=>{const match=String(d).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});proc.on('error',reject);});}async function stop(){const exited=once(proc,'exit');proc.kill();await exited;}try{await start();let r=await fetch(base+'/api/state').then(r=>r.json());const original=structuredClone(r.state);const post=(url,value,t=r.token)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json','X-NetPath-Token':t},body:JSON.stringify(value)});assert.equal((await post('/api/state',r.state,'bad-token')).status,403);r.state.fieldLab={gateway:freshJob('gateway')};r.state.completed=['journey'];r.state.notes.journey='A switch learns source MAC addresses.';r.state.labs['first-lan']=[0];r.state.activeQuiz={questionIds:questions.slice(0,30).map(q=>q.qid),answers:[1,0],index:2,deadline:Date.now()+2700000};r.state.confidence={'1.1':1};r.state.addressPlan=structuredClone(examplePlan);r.state.toolAttempts=[{kind:'routes',task:'specific',score:1,total:1,date:new Date().toISOString()}];r.state.evidence={'first-lan':[{id:'lan-test',date:new Date().toISOString(),source:'PC-A',destination:'192.168.1.20',protocol:'ICMP',expected:'allowed',observed:'allowed',output:'Four replies observed.'}]};let saved=await post('/api/state',r.state);assert.equal(saved.status,200);assert.equal((await post('/api/state',r.state)).status,409);const exported=await fetch(base+'/api/export').then(r=>r.json());assert.equal(exported.notes.journey,r.state.notes.journey);assert.equal((await post('/api/restore',{version:1})).status,400);await stop();await start();r=await fetch(base+'/api/state').then(r=>r.json());assert.deepEqual(r.state.completed,['journey']);assert.equal(r.state.fieldLab.gateway.config.gateway,'192.168.10.1');const badField=structuredClone(r.state);badField.fieldLab.gateway.closed=true;assert.equal((await post('/api/state',badField)).status,400);assert.deepEqual(r.state.labs['first-lan'],[0]);assert.equal(r.state.activeQuiz.questionIds.length,30);assert.equal(r.state.activeQuiz.index,2);assert.equal(r.state.confidence['1.1'],1);assert.deepEqual(r.state.addressPlan,examplePlan);assert.equal(r.state.toolAttempts[0].task,'specific');const badTool=structuredClone(r.state);badTool.toolAttempts[0].score=99;assert.equal((await post('/api/state',badTool)).status,400);const badPlan=structuredClone(r.state);badPlan.addressPlan.requirements='Too large: 999';assert.equal((await post('/api/state',badPlan)).status,400);assert.equal(r.state.evidence['first-lan'][0].output,'Four replies observed.');const invalidEvidence=structuredClone(r.state);invalidEvidence.evidence['first-lan'][0].observed='invented';assert.equal((await post('/api/state',invalidEvidence)).status,400);const restored=await post('/api/restore',original);assert.equal(restored.status,200);assert.deepEqual((await restored.json()).state.completed,[]);const snapshots=readdirSync(path.join(data,'backups'));assert.ok(snapshots.length>=2);assert.ok(snapshots.some(f=>JSON.parse(readFileSync(path.join(data,'backups',f),'utf8')).notes.journey));}finally{if(proc&&!proc.killed)await stop();}});

