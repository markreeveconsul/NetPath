import test from 'node:test';
import assert from 'node:assert/strict';
import {sandboxPage} from './public/network-sandbox.js';
import {exampleNetwork} from './public/sandbox-engine.js';
import {linkStyle,DEVICE_ICONS} from './public/device-icons.js';
import {wireAttributes} from './public/sandbox-visuals.js';
test('visual rendering retains one unchanged symbol per icon and link-state patterns',()=>{
 const n=exampleNetwork();n.devices[0].power=false;const html=sandboxPage({sandbox:n});
 for(const [id,geometry] of Object.entries(DEVICE_ICONS))assert.ok(html.includes('<symbol id="np-device-'+id+'" viewBox="0 0 48 48">'+geometry+'</symbol>'));
 assert.equal((html.match(/<symbol /g)||[]).length,12);
 assert.ok(html.includes(wireAttributes('down','copper')));assert.ok(html.includes(wireAttributes('up','copper')));
 assert.notEqual(linkStyle('down').dash,linkStyle('negotiating').dash);assert.ok(linkStyle('fiber','fiber').width>linkStyle('up','copper').width);
 assert.ok(html.includes('class="ns-port-dot down"'));assert.ok(html.includes('class="ns-port-dot off"'));assert.ok(html.includes('class="ns-port-dot up"'));
});
