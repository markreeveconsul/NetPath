// A fixed-camera isometric view of the training network, driven by probe results.
const positions={pc:[76,177,46],switch:[217,43,40],router:[279,43,40],server:[325,133,68],printer:[172,190,40]};
const labels={pc:'Office PC',switch:'Access switch',router:'Office router',server:'Attendance server',printer:'Printer'};
const project=(x,y,z=0)=>[265+(x-y)*.9,92+(x+y)*.46-z*.95];
const points=a=>a.map(p=>project(...p).join(',')).join(' ');
const polygon=(a,fill)=>`<polygon points="${points(a)}" fill="var(--iso-${fill})"/>`;
function box(x,y,z,w,d,h,top,side='metal-side',front='metal-front'){
 return polygon([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top)+polygon([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],side)+polygon([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],front);
}
export function officeScene({device='pc',last=null,cables=true}={}){
 let s=box(0,0,-8,360,260,8,'floor','floor-edge','floor-edge');
 s+=polygon([[0,0,0],[360,0,0],[360,0,75],[0,0,75]],'wall');
 s+=polygon([[0,0,0],[0,260,0],[0,260,75],[0,0,75]],'wall-side');
 for(let x=40;x<360;x+=40)s+=`<polyline points="${points([[x,0,0],[x,260,0]])}" class="iso-grid"/>`;
 for(let y=40;y<260;y+=40)s+=`<polyline points="${points([[0,y,0],[360,y,0]])}" class="iso-grid"/>`;
 s+=polygon([[0,34,24],[0,105,24],[0,105,62],[0,34,62]],'paper');
 s+=polygon([[0,39,29],[0,100,29],[0,100,57],[0,39,57]],'window');
 if(cables)for(const line of [[[76,177,1],[76,95,1],[217,95,1],[217,43,1]],[[217,43,1],[279,43,1]],[[279,43,1],[325,43,1],[325,133,1]],[[172,190,1],[172,95,1],[217,95,1]]])s+=`<polyline points="${points(line)}" class="iso-cable"/>`;
 s+=box(194,25,0,110,43,31,'wood','wood-side','wood-side');
 s+=`<g data-device="switch">${box(199,33,31,39,23,10,'metal')}</g>`;
 s+=`<g data-device="router">${box(260,33,31,39,23,10,'metal')}</g>`;
 for(const start of [205,266])for(let x=start;x<start+28;x+=6)s+=box(x,56,34,3,1,2,'led','led','led');
 s+=`<g data-device="server">${box(306,110,0,42,43,83,'metal')}`;
 for(let z=15;z<74;z+=15)s+=box(311,153,z,31,1,10,'metal','metal-side','metal-side')+box(336,154,z+4,3,1,3,'led','led','led');
 s+='</g>';
 s+=box(39,144,0,94,58,28,'wood','wood-side','wood-side');
 s+=`<g data-device="pc">${box(60,157,28,39,6,28,'metal')}${polygon([[64,163,34],[95,163,34],[95,163,52],[64,163,52]],'screen')}${box(72,164,28,12,12,3,'metal')}${box(65,181,28,38,12,2,'metal')}</g>`;
 s+=box(66,214,0,30,26,15,'metal-side')+box(66,235,15,30,5,20,'metal');
 s+=box(148,165,0,55,42,21,'wood','wood-side','wood-side');
 s+=`<g data-device="printer">${box(159,173,21,32,25,18,'metal')}${box(164,175,39,22,13,2,'paper')}</g>`;
 if(last){
  const coords=last.path.filter(id=>positions[id]).map(id=>project(...positions[id]));
  const path=coords.map((p,i)=>`${i?'L':'M'}${p.join(',')}`).join(' ');
  s+=`<path class="iso-trace" d="${path}"/>`;
  if(coords.length)s+=`<circle r="6" cx="${coords.at(-1)[0]}" cy="${coords.at(-1)[1]}" fill="var(--accent)"/>`;
  if(last.stop&&positions[last.stop]){const [x,y]=project(...positions[last.stop]);s+=`<circle class="iso-stop" cx="${x}" cy="${y}" r="13"/><text class="iso-stop-label" x="${x}" y="${y+4}" text-anchor="middle">×</text>`;}
 }
 Object.keys(positions).forEach((id,i)=>{const [x,y]=project(...positions[id]);s+=`<g data-device="${id}" class="iso-marker ${device===id?'selected':''}"><circle cx="${x}" cy="${y-32}" r="13"/><text x="${x}" y="${y-28}" text-anchor="middle">${i+1}</text></g>`;});
 return `<div class="office-scene"><svg viewBox="0 0 625 390" role="img" aria-label="Isometric school office. Select a device using the numbered controls below.">${s}</svg></div><div class="office-devices" role="group" aria-label="Select office equipment">${Object.keys(positions).map((id,i)=>`<button data-device="${id}" aria-pressed="${device===id}"><span>${String(i+1).padStart(2,'0')}</span>${labels[id]}</button>`).join('')}</div>`;
}
