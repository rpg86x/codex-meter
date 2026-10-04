// Encrypted snapshot transport. No Codex credentials or RPC commands cross the network.
const http = require('node:http');
const crypto = require('node:crypto');
const os = require('node:os');
const PORT = 43127;
function addresses() {
  return [...new Set(Object.values(os.networkInterfaces()).flat().filter(x => x && x.family === 'IPv4' && !x.internal).map(x => x.address))];
}
function seal(key, value, direction) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64url'), iv);
  cipher.setAAD(Buffer.from('codex-meter-sync-v1:' + direction));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
function open(key, text, direction) {
  const bytes = Buffer.from(text, 'base64url');
  const cipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64url'), bytes.subarray(0,12));
  cipher.setAAD(Buffer.from('codex-meter-sync-v1:' + direction));
  cipher.setAuthTag(bytes.subarray(12,28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8'));
}
function parseCode(code) {
  if (typeof code !== 'string' || code.length > 600 || !code.trim().startsWith('CM1.')) throw Error('sync_code_invalid');
  let value;
  try { value = JSON.parse(Buffer.from(code.trim().slice(4), 'base64url').toString('utf8')); } catch { throw Error('sync_code_invalid'); }
  if (!value || !/^\d{1,3}(\.\d{1,3}){3}$/.test(value.host) || value.host.split('.').some(x => +x > 255) || value.port !== PORT || !/^[\w-]{43}$/.test(value.key) || Buffer.from(value.key,'base64url').length !== 32) throw Error('sync_code_invalid');
  return { host: value.host, port: PORT, key: value.key };
}
function makeCode(host,key) { return 'CM1.' + Buffer.from(JSON.stringify({host,port:PORT,key})).toString('base64url'); }
function snapshot(state) {
  const bucket = b => b ? { limitName:b.limitName,normalModelSlug:b.normalModelSlug,planType:b.planType,credits:b.credits ? {balance:b.credits.balance,unlimited:b.credits.unlimited,hasCredits:b.credits.hasCredits}:null,
    ...Object.fromEntries(['primary','secondary'].map(k=>[k,b[k] ? {usedPercent:b[k].usedPercent,windowDurationMins:b[k].windowDurationMins,resetsAt:b[k].resetsAt}:null])) }:null;
  return { updated:state.updated ?? null,error:state.error ? 'sync_source_error':null,
    data:state.data ? {rateLimits:bucket(state.data.rateLimits),rateLimitsByLimitId:state.data.rateLimitsByLimitId ? Object.fromEntries(Object.entries(state.data.rateLimitsByLimitId).map(([k,v])=>[k,bucket(v)])):null}:null };
}
function createHost(key, readState) {
  const seen = new Map(); let count = 0, minute = Date.now();
  const server = http.createServer((req,res) => {
    res.setHeader('Cache-Control','no-store');
    const fail = status => { res.writeHead(status); res.end(); };
    if (req.method !== 'POST' || req.url !== '/sync') return fail(404);
    if (Date.now()-minute > 60000) {minute=Date.now();count=0;}
    if (++count > 120) return fail(429);
    let body='';
    req.on('data', chunk => {body+=chunk; if(body.length>8192) req.destroy();});
    req.on('error',()=>{});
    req.on('end', () => {
      try {
        const value = open(key,body,'request'), now=Date.now();
        if (!/^[\w-]{32}$/.test(value.id) || !Number.isFinite(value.at) || Math.abs(now-value.at)>90000) return fail(401);
        for (const [id,at] of seen) if(now-at>180000) seen.delete(id);
        if (seen.has(value.id)) return fail(401);
        seen.set(value.id,now);
        res.setHeader('Content-Type','text/plain');
        res.end(seal(key,{id:value.id,state:snapshot(readState())},'response'));
      } catch { fail(401); }
    });
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.timeout=10000;
  return server;
}
function readRemote(config) {
  return new Promise((resolve,reject) => {
    const id=crypto.randomBytes(24).toString('base64url');
    const body=seal(config.key,{id,at:Date.now()},'request');
    const req=http.request({host:config.host,port:config.port,path:'/sync',method:'POST',agent:false,timeout:8000,headers:{'Content-Type':'text/plain','Content-Length':Buffer.byteLength(body)}},res=>{
      let text='';res.on('data',chunk=>{text+=chunk;if(text.length>262144)res.destroy(Error('sync_unavailable'));});
      res.on('error',reject);
      res.on('end',()=>{try{if(res.statusCode!==200)throw Error();const value=open(config.key,text,'response');if(value.id!==id || !value.state || !Object.hasOwn(value.state,'data') || !Object.hasOwn(value.state,'updated'))throw Error();resolve(value.state);}catch{reject(Error('sync_unavailable'));}});
    });
    req.on('timeout',()=>req.destroy(Error('sync_unavailable')));req.on('error',()=>reject(Error('sync_unavailable')));req.end(body);
  });
}
module.exports={PORT,addresses,seal,open,parseCode,makeCode,snapshot,createHost,readRemote};
