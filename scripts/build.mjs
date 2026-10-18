import { readFile,writeFile,mkdir,rm,copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const root=fileURLToPath(new URL('../',import.meta.url));
const service=process.argv[2];
if(!['web','mobile'].includes(service))throw new Error('Expected web or mobile.');
const out=resolve(root,service,'dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const assets=['index.html','styles.css','app.mjs','model.mjs','icon.svg','hero.svg'];
for(const file of assets){if(file==='index.html')await writeFile(join(out,file),(await readFile(join(root,'shared',file),'utf8')).replaceAll('__SERVICE__',service));else await copyFile(join(root,'shared',file),join(out,file));}

// Dependency-free PNG icon rendering; only original geometric brand artwork.
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([length,t,data,crc]);}
function png(size){const raw=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++){for(let x=0;x<size;x++){const px=x/size,py=y/size;let c=[23,62,56];const ell=(cx,cy,rx,ry)=>(px-cx)**2/rx**2+(py-cy)**2/ry**2<1;if(ell(.5,.34,.18,.2))c=[238,176,116];if(ell(.35,.59,.19,.15))c=[197,211,188];if(ell(.65,.59,.19,.15))c=[237,207,102];if(ell(.5,.52,.085,.085))c=[248,245,236];const p=y*(size*4+1)+1+x*4;raw[p]=c[0];raw[p+1]=c[1];raw[p+2]=c[2];raw[p+3]=255;}}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
for(const size of [192,512])await writeFile(join(out,`icon-${size}.png`),png(size));
await writeFile(join(out,'manifest.webmanifest'),JSON.stringify({id:'/',name:service==='mobile'?'CCF Pocket — Community Friends':'Colorized Community Friends',short_name:service==='mobile'?'CCF Pocket':'CCF',description:'Small actions, everyday creativity, and your personal community planner.',start_url:'/#home',scope:'/',display:'standalone',background_color:'#f8f5ed',theme_color:'#173e38',icons:[192,512].map(size=>({src:`/icon-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any maskable'}))},null,2));
const shell=['/','/index.html','/styles.css','/app.mjs','/model.mjs','/icon.svg','/hero.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
const hash=createHash('sha256');for(const path of shell.slice(1))hash.update(await readFile(join(out,path.slice(1))));
const version=`ccf-${service}-${hash.digest('hex').slice(0,16)}`;
await writeFile(join(out,'sw.js'),`const CACHE=${JSON.stringify(version)};\nconst SHELL=${JSON.stringify(shell)};\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});\nself.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ccf-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.search||!SHELL.includes(u.pathname))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});\n`);
console.log(`Built ${service}: ${shell.length+1} public assets. Workbook release disabled.`);
