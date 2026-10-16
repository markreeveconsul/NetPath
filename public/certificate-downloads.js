// Self-contained offline export: rasterize the same SVG used for the earned certificate.
// The PDF embeds a high-resolution JPEG on one landscape A4 page; no remote service or library.
export function imagePdf(jpeg,width,height){
 const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=x=>{const bytes=typeof x==='string'?enc.encode(x):x;chunks.push(bytes);length+=bytes.length;};
 const obj=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`);};
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
 const stream='q\n841.89 0 0 595.28 0 0 cm\n/Im0 Do\nQ\n';obj(5,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);
 const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(chunks,{type:'application/pdf'});
}
const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};
export function bindCertificateDownloads(toast){document.querySelectorAll('[data-certificate-format]').forEach(b=>b.onclick=async()=>{
 b.disabled=true;const original=b.textContent;b.textContent='Preparing…';let url;
 try{const r=await fetch(b.dataset.certificateSource);if(!r.ok)throw Error('Certificate unavailable. Refresh and try again.');const svg=await r.text();url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Unable to render certificate.'));img.src=url;});
 const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1700;const ctx=canvas.getContext('2d');ctx.fillStyle='#faf8f2';ctx.fillRect(0,0,2400,1700);ctx.drawImage(img,0,0,2400,1700);const format=b.dataset.certificateFormat;
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,format==='pdf'?'image/jpeg':'image/png',0.97));if(!blob)throw Error('Image export failed.');save(format==='pdf'?imagePdf(new Uint8Array(await blob.arrayBuffer()),2400,1700):blob,`${b.dataset.certificateName||'NetPath-certificate'}.${format}`);toast('Certificate download prepared.');
 }catch(e){toast(e.message);}finally{if(url)URL.revokeObjectURL(url);b.disabled=false;b.textContent=original;}
 });}

