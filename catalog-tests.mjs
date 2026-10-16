import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEVICE_CATALOG,expandPorts} from './public/device-catalog.js';
import {DEVICE_ICONS,DEVICE_ICON_META} from './public/device-icons.js';
import {createDevice,validateNetwork,ping} from './public/sandbox-engine.js';
import {sandboxPage} from './public/network-sandbox.js';
const fixture=name=>readFileSync(new URL('./fixtures/phase1/'+name,import.meta.url),'utf8');
test('catalog has valid metadata, templates and unique expanded ports',()=>{
 assert.deepEqual(DEVICE_CATALOG.map(d=>d.id),['pc','server','switch','router']);
 for(const d of DEVICE_CATALOG){assert.ok(DEVICE_ICONS[d.iconId]);assert.equal(d.label,DEVICE_ICON_META[d.iconId].label);assert.equal(d.tier,DEVICE_ICON_META[d.iconId].tier);assert.ok(['network','end','security','wan'].includes(d.category));assert.ok(d.hostnamePrefix);assert.deepEqual(Object.keys(d.capabilities).sort(),['filtersTraffic','forwardsL2','routesL3','runsServices','wireless']);assert.ok(Object.values(d.capabilities).every(v=>typeof v==='boolean'));
 for(const p of d.ports){assert.ok(Number.isInteger(p.count)&&p.count>0);assert.ok(Number.isInteger(p.start)&&p.start>=0);assert.ok(p.count===1||p.namePattern.includes('{n}'));assert.ok(['copper','fiber','serial','console'].includes(p.media));assert.ok(['MDI','MDIX','auto'].includes(p.mdi));assert.ok(p.speedMbps>0);}
 const ports=expandPorts(d);assert.equal(new Set(ports.map(p=>p.name)).size,ports.length);assert.ok(ports.every(p=>!p.name.includes('{')));
 }
 assert.equal(Object.keys(DEVICE_ICONS).length,12);
});
test('device creation preserves the pre-refactor v1 defaults exactly',()=>{const old=JSON.parse(fixture('devices-v1.json'));assert.deepEqual(old.map(d=>createDevice(d.kind,d.id)),old);});
test('old export preserves topology and renders its unchanged devices after dock integration',()=>{const old=JSON.parse(fixture('topology-v1.json')),before=structuredClone(old);validateNetwork(old);assert.ok(ping(old,'pc1','192.168.20.10').ok);assert.deepEqual(old,before);assert.deepEqual(JSON.parse(JSON.stringify(old)),before);const html=sandboxPage({sandbox:old}),legacy=fixture('sandbox-v1.html');for(const d of old.devices){assert.ok(html.includes('data-ns-device="'+d.id+'"'));assert.ok(html.includes('left:'+d.x/10+'%;top:'+d.y/6+'%'));assert.ok(html.includes(d.name));}assert.equal((html.match(/<symbol /g)||[]).length,12);assert.equal((html.match(/data-ns-device=/g)||[]).length,old.devices.length);for(const d of old.devices)assert.ok(html.includes('href="#np-device-'+d.kind+'"'));});
test('catalog defaults cannot leak mutable configuration between devices',()=>{const a=createDevice('router','a'),b=createDevice('router','b');a.routes.push({network:'0.0.0.0',prefix:0,nextHop:'10.0.0.1'});a.ports[0].ip='10.0.0.2';assert.deepEqual(b.routes,[]);assert.equal(b.ports[0].ip,'');assert.ok(Object.isFrozen(DEVICE_CATALOG[0].ports));assert.throws(()=>createDevice('unknown','x'),/Unknown/);});
