import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeAttempt,examTypes,certificate} from './practitioner.mjs';
import {questions} from './public/questions.js';
import {imagePdf} from './public/certificate-downloads.js';
import {certificateDesign} from './public/certificate-design.js';
test('specialist tracks draw from their own module and keep constructed work on topic',()=>{
 assert.equal(examTypes.length,7);
 for(const t of examTypes.filter(t=>t.module))for(const difficulty of ['core','applied','challenge']){
  const a=makeAttempt(t.id,difficulty,false,'Learner');
  for(const q of a.items){assert.ok(t.domains.includes(q.domain));if(q.options)assert.equal(questions.find(x=>x.qid===q.id).module,t.module);}
  a.items.forEach((q,i)=>a.answers[i]=q.correct);a.finished=Date.now();assert.match(certificate(a),new RegExp(t.name));
 }
});
test('all preview variants exist and retain sample markings',()=>{
 for(const t of examTypes)for(const d of ['core','applied','challenge'])for(const timed of ['timed','untimed']){
  const svg=readFileSync(new URL(`./public/certificate-previews/${t.id}-${d}-${timed}.svg`,import.meta.url),'utf8');
  assert.match(svg,/PREVIEW - NOT EARNED/);assert.match(svg,/NO CREDENTIAL ISSUED/);assert.ok(svg.includes(t.name));
 }
 const svg=certificateDesign({name:'<script>& test',track:'Routing',level:'Core',score:90,timed:true,date:'2026-09-26',id:'local'});assert.ok(!svg.includes('<script>'));assert.match(svg,/&lt;script&gt;&amp; test/);
});
test('PDF serializer uses byte-correct object offsets and a single landscape page',async()=>{
 const blob=imagePdf(new Uint8Array([255,216,255,217]),2400,1700),bytes=new Uint8Array(await blob.arrayBuffer()),text=new TextDecoder().decode(bytes);
 assert.equal(blob.type,'application/pdf');assert.match(text,/\/Count 1/);assert.match(text,/\/MediaBox \[0 0 841.89 595.28\]/);
 const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(xref,xref+4)),'xref');
 const entries=text.slice(text.indexOf('0000000000 65535 f')).split('\n');for(let i=1;i<=5;i++){const offset=Number(entries[i].slice(0,10));assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+7)),`${i} 0 obj`);}
});
