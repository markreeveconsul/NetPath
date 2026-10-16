import {investigations} from './investigations.js';
import {routeCases} from './route-trainer.js';
import {configTasks} from './config-review.js';
export function validateToolAttempts(records){
 if(records===undefined)return;
 if(!Array.isArray(records)||records.length>300)throw Error('Invalid workbench history.');
 for(const r of records){const bank={incidents:investigations,routes:routeCases,configs:configTasks}[r?.kind],item=bank?.find(x=>x.id===r.task);if(!item||!Number.isInteger(r.score)||!Number.isInteger(r.total)||r.total!==(r.kind==='configs'?item.checks.length:1)||r.score<0||r.score>r.total||typeof r.date!=='string'||!Number.isFinite(Date.parse(r.date)))throw Error('Invalid workbench result.');}
}
