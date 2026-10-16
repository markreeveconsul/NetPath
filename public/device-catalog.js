import {DEVICE_ICON_META} from './device-icons.js';
const capabilities=(overrides={})=>({forwardsL2:false,routesL3:false,runsServices:false,wireless:false,filtersTraffic:false,...overrides});
const port=(namePattern,count,media,mdi,start=0)=>({namePattern,count,media,speedMbps:1000,mdi,start});
const definition=(id,category,hostnamePrefix,ports,features)=>({id,category,label:DEVICE_ICON_META[id].label,hostnamePrefix,iconId:id,tier:DEVICE_ICON_META[id].tier,ports,capabilities:capabilities(features),defaultConfig:{power:true,gateway:'',routes:[]}});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
// Metadata describes the educational model. Speeds do not simulate serialization delay.
export const DEVICE_CATALOG=freeze([
 definition('pc','end','PC',[port('Eth0',1,'copper','MDI')]),
 definition('server','end','SERVER',[port('Eth0',1,'copper','MDI')],{runsServices:true}),
 definition('switch','network','SWITCH',[port('Gi0/{n}',4,'copper','MDIX',1),port('SFP0/1',1,'fiber','auto')],{forwardsL2:true}),
 definition('router','network','ROUTER',[port('Gi0/{n}',2,'copper','MDI'),port('SFP0/0',1,'fiber','auto')],{routesL3:true})
]);
export const deviceDefinition=id=>DEVICE_CATALOG.find(d=>d.id===id);
export function expandPorts(definition){return definition.ports.flatMap(p=>Array.from({length:p.count},(_,i)=>({name:p.namePattern.replace('{n}',String(i+p.start)),media:p.media,speedMbps:p.speedMbps,mdi:p.mdi})));}
