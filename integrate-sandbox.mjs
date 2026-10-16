import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const root=new URL('./',import.meta.url),backup=new URL('./.development/pre-sandbox/',root);mkdirSync(backup,{recursive:true});
for(const name of ['public/app.js','public/index.html','server.mjs','package.json'])copyFileSync(new URL(name,root),new URL(name.replaceAll('/','-'),backup));
const edit=(name,fn)=>{const p=new URL(name,root);writeFileSync(p,fn(readFileSync(p,'utf8')));};
edit('public/app.js',s=>"import {sandboxPage,bindSandbox} from './network-sandbox.js';\n"+s.replace("['field','Field lab','⌁']","['field','Guided missions','⌁'],['sandbox','Network sandbox','▦']").replace("const body=page==='field'?","const body=page==='sandbox'?sandboxPage(state):page==='field'?").replace('bindField({save,render,toast});','bindSandbox({save,render,toast});\nbindField({save,render,toast});').replace("['Field lab',['field','labs','workbench']]","['Field lab',['sandbox','field','labs','workbench']]"));
edit('server.mjs',s=>"import {validateNetwork} from './public/sandbox-engine.js';\n"+s.replace('function validateContent(s){','function validateContent(s){validateNetwork(s.sandbox);'));
edit('public/index.html',s=>s.replace('</head>','<link rel="stylesheet" href="/network-sandbox.css"></head>'));
edit('package.json',s=>{const p=JSON.parse(s);p.version='1.8.0';p.scripts.test+=' sandbox-tests.mjs';return JSON.stringify(p,null,2)+'\n';});
