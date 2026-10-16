import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {exampleNetwork} from './public/sandbox-engine.js';
test('sandbox API saves topology across restart, exports backups and rejects invalid cables',async()=>{
 const dir=fileURLToPath(new URL('./.development/api-test-'+Date.now()+'/',import.meta.url));mkdirSync(dir,{recursive:true});let child;
 const start=async()=>{child=spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('./',import.meta.url)),env:{...process.env,PORT:'0',NETPATH_DATA:dir},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{child.stdout.on('data',b=>{const m=String(b).match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});child.on('error',reject);child.on('exit',c=>reject(Error('Server exited '+c)));});};
 const stop=()=>new Promise(resolve=>{child.once('exit',resolve);child.kill();});
 try{let base=await start();let {state,token}=await (await fetch(base+'/api/state')).json();const topology=exampleNetwork();topology.devices[0].x=200;topology.realism='exam';topology.links.forEach(l=>l.cableType=l.id==='c3'?'crossover':'straight');state.sandbox=topology;
 const post=async(path,data)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-netpath-token':token},body:JSON.stringify(data)});
 const saved=await post('/api/state',state);assert.equal(saved.status,200);state=(await saved.json()).state;
 const bad=structuredClone(state);bad.sandbox.links.push({...bad.sandbox.links[0],id:'duplicate-port'});assert.equal((await post('/api/state',bad)).status,400);
 const wrongMode=structuredClone(state);wrongMode.sandbox.realism='invalid';assert.equal((await post('/api/state',wrongMode)).status,400);const wrongType=structuredClone(state);wrongType.sandbox.links[0].cableType='fiber';assert.equal((await post('/api/state',wrongType)).status,400);
 const exported=await (await fetch(base+'/api/export')).json();assert.deepEqual(exported.sandbox,topology);
 assert.equal((await post('/api/restore',exported)).status,200);await stop();base=await start();const reload=await (await fetch(base+'/api/state')).json();assert.deepEqual(reload.state.sandbox,topology);
 }finally{if(child?.exitCode===null)await stop();}
});
