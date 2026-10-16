import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyNetwork,createDevice,exampleNetwork,validateNetwork,connect,removeDevice,ping,linkUp} from './public/sandbox-engine.js';
test('sandbox traffic follows physical cables and verifies return reachability',()=>{const n=exampleNetwork();assert.equal(ping(n,'pc1','192.168.20.10').ok,true);n.links.pop();assert.equal(ping(n,'pc1','192.168.20.10').ok,false);});
test('sandbox power, admin state, and VLAN separation cause distinct reachability changes',()=>{
 for(const fault of ['power','port','vlan']){const n=exampleNetwork(),s=n.devices[1];if(fault==='power')s.power=false;if(fault==='port')s.ports[0].enabled=false;if(fault==='vlan')s.ports[0].vlan=20;assert.equal(ping(n,'pc1','192.168.20.10').ok,false);if(fault!=='vlan')assert.equal(linkUp(n,n.links[0]),false);else assert.equal(linkUp(n,n.links[0]),true);}
});
test('sandbox rejects duplicate port occupation and incompatible fiber connections',()=>{const n=exampleNetwork();assert.throws(()=>connect(n,{device:'pc1',port:'Eth0'},{device:'sw1',port:'Gi0/3'},'copper','c4'),/free compatible/);n.links=[];assert.throws(()=>connect(n,{device:'pc1',port:'Eth0'},{device:'sw1',port:'SFP0/1'},'fiber','c4'),/compatible/);connect(n,{device:'sw1',port:'SFP0/1'},{device:'r1',port:'SFP0/0'},'fiber','fiber1');assert.equal(linkUp(n,n.links[0]),true);});
test('sandbox reports a missing return gateway even when request delivery succeeds',()=>{const n=exampleNetwork();n.devices[3].gateway='';const r=ping(n,'pc1','192.168.20.10');assert.equal(r.ok,false);assert.match(r.message,/reply failed/);});
test('sandbox detects an invalid gateway, duplicate neighbors, and invalid host addresses',()=>{const n=exampleNetwork();n.devices[0].gateway='10.0.0.1';assert.match(ping(n,'pc1','192.168.20.10').message,/next hop/);n.devices[0].gateway='192.168.10.1';const extra=createDevice('pc','extra');extra.ports[0].ip='192.168.10.1';n.devices.push(extra);connect(n,{device:'extra',port:'Eth0'},{device:'sw1',port:'Gi0/3'},'copper','extra-link');assert.match(ping(n,'pc1','192.168.20.10').message,/duplicate/);extra.ports[0].ip='192.168.10.255';assert.throws(()=>validateNetwork(n),/interface/);});
test('sandbox static routes connect two routers and require a return route',()=>{
 const n=exampleNetwork(),r=n.devices[2],b=n.devices[3];n.links=n.links.filter(l=>l.id!=='c3');r.ports[1].ip='10.0.0.1';r.ports[1].prefix=30;
 const r2=createDevice('router','r2');r2.ports[0].ip='10.0.0.2';r2.ports[0].prefix=30;r2.ports[1].ip='192.168.20.1';n.devices.push(r2);
 connect(n,{device:'r1',port:'Gi0/1'},{device:'r2',port:'Gi0/0'},'copper','transit');connect(n,{device:'r2',port:'Gi0/1'},{device:b.id,port:'Eth0'},'copper','server');
 assert.equal(ping(n,'pc1','192.168.20.10').ok,false);r.routes.push({network:'192.168.20.0',prefix:24,nextHop:'10.0.0.2'});assert.match(ping(n,'pc1','192.168.20.10').message,/reply failed/);r2.routes.push({network:'192.168.10.0',prefix:24,nextHop:'10.0.0.1'});assert.equal(ping(n,'pc1','192.168.20.10').ok,true);
 r.routes.unshift({network:'0.0.0.0',prefix:0,nextHop:'10.0.0.3'});assert.equal(ping(n,'pc1','192.168.20.10').ok,true);
});
test('sandbox local LAN needs no gateway; deleting equipment removes its cables',()=>{const n=exampleNetwork();n.devices[0].gateway='';assert.equal(ping(n,'pc1','192.168.10.1').ok,true);removeDevice(n,'sw1');assert.ok(n.links.every(l=>l.a.device!=='sw1'&&l.b.device!=='sw1'));validateNetwork(n);validateNetwork(emptyNetwork());validateNetwork(undefined);});
