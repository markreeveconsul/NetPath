import {validateNetwork} from './public/sandbox-engine.js';
import {validateField} from './public/field-engine.js';
import {examStore} from './practitioner.mjs';
import {validateToolAttempts} from './public/tool-records.js';
import {allocateVlsm} from './public/vlsm.js';
import {validateEvidence} from './public/evidence.js';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import net from 'node:net';
import {spawn,execFile} from 'node:child_process';
import {lessons} from './public/course.js';
import {questions} from './public/questions.js';
import {labs} from './public/labs.js';
import {objectives} from './public/coverage.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const installationId=crypto.createHash('sha256').update(root.replaceAll('\\','/').toLowerCase()).digest('hex');
const ptRoot='C:/Program Files/Cisco Packet Tracer 9.0.1';
const ptExe=path.join(ptRoot,'bin','PacketTracer.exe');
let lastPtLaunch=0;
const ptRunning=()=>new Promise((resolve,reject)=>execFile('tasklist.exe',['/FI','IMAGENAME eq PacketTracer.exe','/FO','CSV','/NH'],{timeout:3000,windowsHide:true},(error,stdout)=>error?reject(Error('Unable to check existing Packet Tracer windows. Please open the app manually.')):resolve(/"PacketTracer\.exe"/i.test(stdout))));
const ptImages=new Set(['mode_simulation_1.jpg','mode_simulation_2.jpg','mode_simulation_3.jpg']);
const ipcListening=()=>new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port:39000});let finished=false;const finish=ok=>{if(finished)return;finished=true;socket.destroy();resolve(ok);};socket.setTimeout(1200,()=>finish(false));socket.on('connect',()=>finish(true));socket.on('error',()=>finish(false));});
const data=process.env.NETPATH_DATA||path.join(root,'data');mkdirSync(data,{recursive:true});mkdirSync(path.join(data,'backups'),{recursive:true});
const db=new DatabaseSync(path.join(data,'netpath.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);');
const exams=examStore(db,()=>get().completed);
const initial={version:1,revision:0,completed:[],attempts:[],notes:{},cards:{},labs:{},settings:{name:'Learner',hours:5,examDate:'',examVersion:'undecided'},lastLesson:'journey'};
db.prepare('INSERT OR IGNORE INTO state(id,value) VALUES(1,?)').run(JSON.stringify(initial));
const get=()=>JSON.parse(db.prepare('SELECT value FROM state WHERE id=1').get().value);
function validateQuiz(s){const q=s.activeQuiz;if(q!=null&&(!Array.isArray(q.questionIds)||![10,30,60].includes(q.questionIds.length)||!q.questionIds.every(id=>questions.some(x=>x.qid===id||x.id===id))||!Array.isArray(q.answers)||q.answers.length>q.questionIds.length||!q.answers.every(a=>a==null||Number.isInteger(a)&&a>=0&&a<=2)||!Number.isInteger(q.index)||q.index<0||q.index>=q.questionIds.length||!Number.isFinite(q.deadline)))throw Error('Invalid saved knowledge check.');return s;}
function validateContent(s){validateNetwork(s.sandbox);validateField(s.fieldLab);if(s.settings.simpleLessons!==undefined&&typeof s.settings.simpleLessons!=='boolean')throw Error('Invalid reading mode.');validateToolAttempts(s.toolAttempts);if(s.addressPlan!=null)allocateVlsm(s.addressPlan);validateEvidence(s.evidence,labs.map(l=>l.id));if(s.completed.some(id=>!lessons.some(l=>l.id===id))||new Set(s.completed).size!==s.completed.length)throw Error('Invalid lesson completion list.');for(const [id,steps] of Object.entries(s.labs)){const lab=labs.find(l=>l.id===id);if(!lab||steps.some(i=>i>=lab.steps.length)||new Set(steps).size!==steps.length)throw Error('Invalid lab checkpoints.');}if(!['undecided','v1.1','v2.0'].includes(s.settings.examVersion))throw Error('Invalid exam target.');if(s.settings.examDate&&!/^\d{4}-\d{2}-\d{2}$/.test(s.settings.examDate))throw Error('Invalid exam date.');if(s.confidence!=null&&(typeof s.confidence!=='object'||Array.isArray(s.confidence)||Object.entries(s.confidence).some(([id,rating])=>!objectives.some(o=>o.id===id)||![0,1,2].includes(rating))))throw Error('Invalid objective self-assessment.');return s;}
function validate(s){if(!s||s.version!==1||!Array.isArray(s.completed)||!s.completed.every(x=>typeof x==='string')||!Array.isArray(s.attempts)||!s.notes||typeof s.notes!=='object'||Array.isArray(s.notes)||!s.cards||typeof s.cards!=='object'||Array.isArray(s.cards)||!s.labs||typeof s.labs!=='object'||Array.isArray(s.labs)||!s.settings||typeof s.settings!=='object')throw Error('This is not a valid NetPath backup.');if(!Object.values(s.notes).every(x=>typeof x==='string'&&x.length<=50000))throw Error('Invalid notes.');if(!s.attempts.every(x=>x&&typeof x.lesson==='string'&&Number.isFinite(x.score)&&Number.isFinite(x.total)&&x.score>=0&&x.total>0&&x.score<=x.total&&typeof x.date==='string'))throw Error('Invalid assessment history.');if(!Object.values(s.cards).every(x=>x&&Number.isFinite(x.due)&&Number.isFinite(x.interval)))throw Error('Invalid review schedule.');if(!Object.values(s.labs).every(x=>Array.isArray(x)&&x.every(v=>Number.isInteger(v)&&v>=0)))throw Error('Invalid lab checklist.');if(typeof s.settings.name!=='string'||s.settings.name.length>80||!Number.isFinite(s.settings.hours)||s.settings.hours<1||s.settings.hours>60||typeof s.settings.examDate!=='string')throw Error('Invalid study settings.');return s;}
function backup(){const name=`netpath-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;writeFileSync(path.join(data,'backups',name),JSON.stringify({...get(),practitionerArchive:exams.archive()},null,2));const files=readdirSync(path.join(data,'backups')).filter(x=>/^netpath-.*\.json$/.test(x)).sort();for(const f of files.slice(0,-30))unlinkSync(path.join(data,'backups',f));return name;}
backup();let lastBackup=Date.now();const token=crypto.randomBytes(24).toString('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};try{
if(!/^((127\.0\.0\.1)|(localhost))(:\d+)?$/.test(req.headers.host||''))return send(403,{error:'Local access only.'});
const url=new URL(req.url,'http://localhost');
if(url.pathname==='/api/installation'&&req.method==='GET')return send(200,{app:'NetPath',version:'1.8.0',installationId});
if(url.pathname==='/api/practitioner'&&req.method==='GET')return send(200,exams.status());
if(url.pathname.startsWith('/api/practitioner/certificate/')&&req.method==='GET'){try{const svg=exams.certificate(url.pathname.split('/').at(-1));res.writeHead(200,{'Content-Type':'image/svg+xml','Content-Disposition':'attachment; filename="NetPath-certificate.svg"','Cache-Control':'no-store'});return res.end(svg);}catch(e){return send(400,{error:e.message});}}
if(url.pathname==='/api/state'&&req.method==='GET')return send(200,{state:get(),token});
if(url.pathname==='/api/packet-tracer'&&req.method==='GET')return send(200,{installed:existsSync(ptExe),version:existsSync(ptExe)?'9.0.1.0858':null,framework:existsSync(path.join(ptRoot,'help/default/ipc/pt-cep-java-framework-9.0.0.0.jar')),listenerReachable:await ipcListening(),liveConnected:false});
if(url.pathname.startsWith('/packet-tracer-help/')&&req.method==='GET'){const name=url.pathname.slice('/packet-tracer-help/'.length);if(!ptImages.has(name))return send(404,{error:'Not found.'});const file=path.join(ptRoot,'help/default/images',name);if(!existsSync(file))return send(404,{error:'Installed Packet Tracer help image unavailable.'});res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600'});return res.end(readFileSync(file));}
if(url.pathname==='/api/export'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename="netpath-backup.json"','Cache-Control':'no-store'});return res.end(JSON.stringify({...get(),practitionerArchive:exams.archive()},null,2));}
if(url.pathname.startsWith('/api/')&&req.method==='POST'){
if(req.headers['x-netpath-token']!==token)return send(403,{error:'Refresh the page and try again.'});
let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>10_000_000)return send(413,{error:'Backup is too large (maximum 10 MB).'});}let payload;try{payload=JSON.parse(body||'{}');}catch{return send(400,{error:'Invalid JSON.'});}
if(url.pathname.startsWith('/api/practitioner/')){const action=url.pathname.split('/').at(-1);if(!['start','answer','finish'].includes(action))return send(404,{error:'Unknown exam action.'});try{return send(200,exams[action](payload));}catch(e){return send(400,{error:e.message});}}
if(url.pathname==='/api/backup')return send(200,{file:backup()});
if(url.pathname==='/api/packet-tracer/launch'){if(!existsSync(ptExe))return send(404,{error:'Packet Tracer was not found at the configured installation path.'});if(Date.now()-lastPtLaunch<5000||await ptRunning())return send(200,{launched:false,message:'Packet Tracer is already open or starting. Switch to its window and finish sign-in if needed.'});lastPtLaunch=Date.now();await new Promise((resolve,reject)=>{const child=spawn(ptExe,[],{detached:true,stdio:'ignore',cwd:path.dirname(ptExe)});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});return send(200,{launched:true,message:'Packet Tracer launch requested. Complete sign-in in its window if needed.'});}
if(url.pathname==='/api/state'||url.pathname==='/api/restore'){let next;try{next=validateContent(validateQuiz(validate(payload)));if(url.pathname==='/api/restore'&&next.practitionerArchive!==undefined)exams.validateArchive(next.practitionerArchive);}catch(e){return send(400,{error:e.message});}const current=get();if(url.pathname==='/api/state'&&next.revision!==current.revision)return send(409,{error:'Progress changed in another window. Reload before saving; copy any unsaved notes first.'});if(url.pathname==='/api/restore'||Date.now()-lastBackup>600000){backup();lastBackup=Date.now();}const archive=next.practitionerArchive;delete next.practitionerArchive;next.revision=current.revision+1;db.exec('BEGIN');try{if(url.pathname==='/api/restore'&&archive!==undefined)exams.restore(archive);db.prepare('UPDATE state SET value=? WHERE id=1').run(JSON.stringify(next));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(200,{state:next});}
return send(404,{error:'Not found.'});}
if(req.method!=='GET')return send(405,{error:'Method not allowed.'});const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(root,'public','.'+relative);if(!file.startsWith(path.join(root,'public')+path.sep)||!existsSync(file))return send(404,{error:'Not found.'});res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(readFileSync(file));
}catch(e){console.error(e);send(500,{error:'Unable to complete this operation. Your last saved progress is preserved.'});}});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`NetPath ready: http://127.0.0.1:${server.address().port}`));
