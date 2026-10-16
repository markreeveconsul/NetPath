import test from 'node:test';
import assert from 'node:assert/strict';
import {jobs,freshJob,baseline,probe,command,validateField} from './public/field-engine.js';
import {coaching,packetStep,missionStatus} from './public/mission-coach.js';
test('packet inspection preserves IP destination and reveals failure at the correct device',()=>{
 const result=probe(baseline,'server');
 for(let i=0;i<result.path.length;i++){const step=packetStep(result,'server',i);assert.equal(step.id,result.path[i]);assert.equal(step.destination,'192.168.20.10');assert.equal(step.complete,i===result.path.length-1);}
 assert.equal(packetStep(probe(baseline,'printer'),'printer',99).id,'printer');
 for(const job of jobs){const failed=probe(freshJob(job.id).config,'server');const step=packetStep(failed,'server',99);assert.equal(step.id,failed.stop);assert.equal(step.stopped,true);assert.equal(step.description,failed.message);}
});
test('legacy mission saves remain valid and coaching metadata cannot bypass repair verification',()=>{
 const r=freshJob('gateway');validateField({gateway:r});r.hintLevel=4;assert.throws(()=>validateField({gateway:r}),/hint/);r.hintLevel=2;r.reflection=1;assert.throws(()=>validateField({gateway:r}),/reflection/);
 r.config={...baseline};r.checks={printer:true,server:true};r.closed=true;validateField({gateway:r});assert.match(missionStatus(r),/reflection completed/);
 for(const job of jobs){const c=coaching[job.id];assert.equal(c.hints.length,3);assert.equal(c.options.length,3);assert.ok(c.options[c.answer]);}
});
test('each office fault has a distinct failure point and the correct repair restores both services',()=>{
 for(const job of jobs){const r=freshJob(job.id);assert.equal(probe(r.config,'server').ok,false);assert.equal(probe(r.config,'printer').ok,job.id!=='vlan');assert.equal(probe(r.config,'server').stop,{gateway:'pc',vlan:'switch',policy:'router'}[job.id]);r.config={...baseline};for(const t of ['printer','server']){assert.equal(probe(r.config,t).ok,true);r.checks[t]=true;}r.closed=true;validateField({[job.id]:r});}
});
test('unrelated configuration changes cannot fix the fault and unsupported commands are explicit',()=>{
 const r=freshJob('vlan');r.config.gateway='192.168.10.65';assert.equal(command(r,'ping 192.168.20.10').result.ok,false);assert.match(command(r,'show vlan brief').text,/VLAN 10/);assert.match(command(r,'erase startup-config').text,/not supported/);
});
test('save validation rejects invalid settings and completion without verified services',()=>{
 const r=freshJob('gateway');r.closed=true;assert.throws(()=>validateField({gateway:r}),/Verify/);r.closed=false;r.checks.server=true;assert.throws(()=>validateField({gateway:r}),/Checks/);r.checks.server=false;r.config.gateway='999.1.1.1';assert.throws(()=>validateField({gateway:r}),/configuration/);assert.throws(()=>validateField({unknown:freshJob('vlan')}));
});
