import {shuffled} from './logic.js';
export function practiceDomain(q){
 if(['foundations','addressing'].includes(q.module)||['wireless','dhcp-dns'].includes(q.id))return '1';
 if(q.module==='switching'||['troubleshooting','capstone'].includes(q.id))return '2';
 if(q.module==='routing')return '3';
 if(q.module==='security'||['nat','dns-records','secure-transfer'].includes(q.id))return '4';
 return '5';
}
export function selectBalanced(bank,attempts=[]){
 const seen=new Set(attempts.map(a=>a.qid)),selected=[];
 for(const [domain,count] of [['1',15],['2',15],['3',12],['4',12],['5',6]]){
  const pool=shuffled(bank.filter(q=>practiceDomain(q)===domain)).sort((a,b)=>Number(seen.has(a.qid))-Number(seen.has(b.qid)));
  if(pool.length<count)throw Error(`Domain ${domain} needs ${count} questions; only ${pool.length} are available.`);
  selected.push(...pool.slice(0,count));
 }
 return shuffled(selected);
}
export function selectPractice(bank,count,scope,attempts=[]){
 if(scope==='balanced'){if(count!==60)throw Error('The domain-balanced session uses 60 questions. Select that session length.');return selectBalanced(bank,attempts);}
 const pool=bank.filter(q=>scope==='all'||scope==='weak'||q.module===scope);
 if(![10,30,60].includes(count)||pool.length<count)throw Error(`This focus has ${pool.length} questions. Choose a shorter session or a broader focus.`);
 const seen=new Set(attempts.filter(a=>typeof a.qid==='string').map(a=>a.qid));
 const recent=new Map();
 // Recent per-lesson evidence, including histories from before stable question IDs were saved.
 for(const a of attempts.slice(-200)){if(!recent.has(a.lesson))recent.set(a.lesson,[]);const list=recent.get(a.lesson);list.push(a);if(list.length>5)list.shift();}
 const weak=new Set([...recent].filter(([,items])=>items.reduce((s,a)=>s+a.score,0)/items.reduce((s,a)=>s+a.total,0)<.8).map(([id])=>id));
 const rank=q=>(scope==='weak'&&!weak.has(q.id)?2:0)+(seen.has(q.qid)?1:0);
 return shuffled(pool).sort((a,b)=>rank(a)-rank(b)).slice(0,count);
}
