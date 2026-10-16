
import {sandboxPage,bindSandbox} from './network-sandbox.js';import {exampleNetwork,createDevice} from './sandbox-engine.js';
location.hash='sandbox';let state={sandbox:exampleNetwork()},frames=[],running=false,last=0;const out=document.querySelector('#measurement');
function render(){document.querySelector('#qa').innerHTML=sandboxPage(state);bindSandbox({save:async fn=>{const next=structuredClone(state);fn(next);state=next;return true;},render,toast:text=>{out.textContent=text;}});}render();
document.querySelector('#seed').onclick=()=>{state.sandbox=exampleNetwork();for(let i=4;i<50;i++)state.sandbox.devices.push(createDevice('pc','qa'+i,80+(i%10)*90,70+Math.floor(i/10)*95));render();};
function frame(t){if(!running)return;if(last)frames.push(t-last);last=t;requestAnimationFrame(frame);}document.querySelector('#profile').onclick=()=>{frames=[];last=0;running=true;out.textContent='Profiling frames — drag devices now';requestAnimationFrame(frame);};document.querySelector('#stop').onclick=()=>{running=false;const avg=frames.reduce((a,b)=>a+b,0)/frames.length;const sorted=[...frames].sort((a,b)=>a-b);out.textContent=frames.length+' frames; '+(1000/avg).toFixed(1)+' FPS average; p95 '+sorted[Math.floor(sorted.length*.95)]?.toFixed(1)+' ms';};
// Count frame intervals only while an actual device drag is active.
let armed=false,dragFrames=[],dragLast=0,dragging=false,dragCount=0;
const report=()=>{const sorted=[...dragFrames].sort((a,b)=>a-b),avg=dragFrames.reduce((a,b)=>a+b,0)/dragFrames.length;out.textContent=dragCount+' drags; '+dragFrames.length+' drag frames; '+(1000/avg).toFixed(1)+' FPS; p95 '+sorted[Math.floor(sorted.length*.95)]?.toFixed(1)+' ms';};
const dragFrame=t=>{if(!dragging)return;if(dragLast)dragFrames.push(t-dragLast);dragLast=t;requestAnimationFrame(dragFrame);};
document.querySelector('#profile').onclick=()=>{armed=true;dragFrames=[];dragCount=0;out.textContent='Armed: drag a canvas device repeatedly, then Stop profile.';};
document.addEventListener('pointerdown',e=>{if(armed&&e.target.closest('[data-ns-device]')){dragging=true;dragLast=0;dragCount++;requestAnimationFrame(dragFrame);}},true);
document.addEventListener('pointerup',()=>{if(dragging){dragging=false;report();}},true);
document.querySelector('#stop').onclick=()=>{armed=false;dragging=false;report();};
