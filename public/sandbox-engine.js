export * from './sandbox-topology.js';
export {simulate,emptySimulation} from './sandbox-simulation.js';
import {simulate} from './sandbox-simulation.js';
import {describeEvent,describeResult} from './sandbox-explanations.js';
import {emptyNetwork,createDevice,connect} from './sandbox-topology.js';
export function ping(net,sourceId,destination){const r=simulate(net,{type:'ping',sourceId,destination});return {...r.result,message:describeResult(r.result,r.trace),steps:r.trace.map(e=>({...e,message:describeEvent(e)}))};}
export function exampleNetwork(){const n=emptyNetwork();const a=createDevice('pc','pc1',150,190),s=createDevice('switch','sw1',370,190),r=createDevice('router','r1',600,190),b=createDevice('server','srv1',830,330);a.name='Office PC';s.name='Access switch';r.name='Office router';b.name='Attendance';a.ports[0].ip='192.168.10.10';a.gateway='192.168.10.1';r.ports[0].ip='192.168.10.1';r.ports[1].ip='192.168.20.1';b.ports[0].ip='192.168.20.10';b.gateway='192.168.20.1';n.devices=[a,s,r,b];connect(n,{device:'pc1',port:'Eth0'},{device:'sw1',port:'Gi0/1'},'copper','c1');connect(n,{device:'sw1',port:'Gi0/2'},{device:'r1',port:'Gi0/0'},'copper','c2');connect(n,{device:'r1',port:'Gi0/1'},{device:'srv1',port:'Eth0'},'copper','c3');return n;}
