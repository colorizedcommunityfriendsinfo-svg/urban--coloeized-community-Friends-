import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createApp } from '../shared/server.mjs';
import { cleanState,selectActivities } from '../shared/model.mjs';

test('search, category and saved filters compose',()=>{
  assert.equal(selectActivities({query:'COLOR',category:'Create'}).length,1);
  assert.deepEqual(selectActivities({savedOnly:true,favorites:['kind-note']}).map(a=>a.id),['kind-note']);
  assert.equal(selectActivities({query:'does not exist'}).length,0);
});
test('stored state rejects corrupt records and bounds user data',()=>{
  assert.deepEqual(cleanState(null),{favorites:[],tasks:[]});
  const state=cleanState({favorites:['unknown','kind-note','kind-note'],tasks:[null,{id:'a',title:'  hello  ',done:true},{id:'a',title:'duplicate'},{id:'b',title:'x'.repeat(400),done:'true'}]});
  assert.deepEqual(state.favorites,['kind-note']);assert.equal(state.tasks.length,2);assert.equal(state.tasks[0].title,'hello');assert.equal(state.tasks[1].title.length,160);assert.equal(state.tasks[1].done,false);
});
for(const service of ['web','mobile'])test(`${service} HTTP boundary and public assets`,async t=>{
  const server=await createApp({directory:fileURLToPath(new URL(`../${service}/dist/`,import.meta.url)),service});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const health=await fetch(`${base}/healthz`);assert.equal(health.status,200);assert.equal((await health.json()).workbookReleaseEnabled,false);
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),new RegExp(`data-service="${service}"`));assert.equal(home.headers.get('x-frame-options'),'DENY');assert.match(home.headers.get('content-security-policy'),/script-src 'self'/);
  for(const options of [{},{method:'POST',body:JSON.stringify({memberId:'another-member',fileId:'arbitrary'})},{headers:{Authorization:'Bearer fabricated'}}]){
    const deny=await fetch(`${base}/api/workbook?memberId=another&fileId=arbitrary`,options);assert.equal(deny.status,403);assert.equal(deny.headers.get('cache-control'),'no-store');assert.deepEqual(await deny.json(),{error:'WORKBOOK_UNAVAILABLE',releaseEnabled:false});
  }
  const head=await fetch(base,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  for(const path of ['/package.json','/.env','/server.mjs','/not-found','/api/private'])assert.equal((await fetch(base+path)).status,404);
  const traversal=await new Promise((resolve,reject)=>http.get(`${base}/%2e%2e%2fshared%2fserver.mjs`,r=>{r.resume();resolve(r.statusCode);}).on('error',reject));assert.equal(traversal,404);
  assert.equal((await fetch(base+'/%ZZ')).status,400);
  const manifest=await(await fetch(base+'/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');assert.equal(manifest.icons.length,2);
  for(const item of manifest.icons){const r=await fetch(base+item.src);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');}
  const sw=await(await fetch(base+'/sw.js')).text();assert.match(sw,/SHELL.includes\(u.pathname\)/);assert.doesNotMatch(sw,/api\/workbook/);
});
