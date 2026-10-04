const test=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const crypto=require('node:crypto');
const {seal,open,makeCode,parseCode,createHost,readRemote,snapshot}=require('./sync.cjs');
const key=()=>crypto.randomBytes(32).toString('base64url');
test('pairing codes validate and authenticated envelopes reject tampering and reflection',()=>{
 const secret=key();const code=makeCode('192.168.1.2',secret);assert.deepEqual(parseCode(code),{host:'192.168.1.2',port:43127,key:secret});
 for(const bad of ['',code.slice(0,10),'CM1.'+Buffer.from(JSON.stringify({host:'attacker/path',port:43127,key:secret})).toString('base64url')])assert.throws(()=>parseCode(bad));
 const encrypted=seal(secret,{privateValue:'hello'},'request');assert.ok(!encrypted.includes('hello'));assert.deepEqual(open(secret,encrypted,'request'),{privateValue:'hello'});
 assert.throws(()=>open(secret,encrypted,'response'));assert.throws(()=>open(key(),encrypted,'request'));
 const damaged=Buffer.from(encrypted,'base64url');damaged[30]^=1;assert.throws(()=>open(secret,damaged.toString('base64url'),'request'));
});
test('two endpoints share only readings, preserve stale timestamps, reject replay, wrong codes and revoke access',async()=>{
 const secret=key();let reading={data:{accountId:'private',rateLimits:{primary:{usedPercent:23,resetsAt:1700000000,windowDurationMins:300},credits:{balance:'12.5'},token:'private'}},updated:123456,error:null};
 const server=createHost(secret,()=>reading);await new Promise(r=>server.listen(0,'127.0.0.1',r));const config={host:'127.0.0.1',port:server.address().port,key:secret};
 try{
  const received=await readRemote(config);assert.equal(received.data.rateLimits.primary.usedPercent,23);assert.equal(received.updated,123456);assert.ok(!JSON.stringify(received).includes('private'));
  reading={...reading,error:'Internal error with credentials'};const stale=await readRemote(config);assert.equal(stale.updated,123456);assert.equal(stale.error,'sync_source_error');
  await assert.rejects(()=>readRemote({...config,key:key()}));
  const request=body=>new Promise((resolve,reject)=>{const req=http.request({...config,path:'/sync',method:'POST'},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end(body);});
  const body=seal(secret,{id:crypto.randomBytes(24).toString('base64url'),at:Date.now()},'request');assert.equal(await request(body),200);assert.equal(await request(body),401);
  assert.equal(await request(seal(secret,{id:crypto.randomBytes(24).toString('base64url'),at:Date.now()-100000},'request')),401);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 await assert.rejects(()=>readRemote(config));
 assert.deepEqual(snapshot({}),{data:null,updated:null,error:null});
});
