const {spawn}=require('node:child_process');
const {createInterface}=require('node:readline');
const path=require('node:path');
class Client {
 constructor(){this.next=0;this.pending=new Map();}
 async start(){
  const exe=process.env.CODEX_METER_CLI||(process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'Programs','OpenAI','Codex','bin','codex.exe'):'codex');
  this.proc=spawn(exe,['app-server','--stdio'],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:process.platform==='win32'?{...process.env,HOME:process.env.USERPROFILE}:process.env});
  const fail=()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Codex-verbinding gesloten. Controleer of Codex is geïnstalleerd en aangemeld.'));}this.pending.clear();this.dead=true;};
  this.proc.on('error',fail);this.proc.on('exit',fail);this.proc.stdin.on('error',fail);this.proc.stderr.resume();
  createInterface({input:this.proc.stdout}).on('line',line=>{try{const msg=JSON.parse(line);const p=this.pending.get(msg.id);if(p){clearTimeout(p.timer);this.pending.delete(msg.id);msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result);}}catch{}});
  await this.call('initialize',{clientInfo:{name:'codex_meter',title:'Codex Meter',version:'1.0.0'}});
  this.proc.stdin.write(JSON.stringify({method:'initialized'})+'\n');
 }
 call(method,params){return new Promise((resolve,reject)=>{const id=++this.next;const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Geen antwoord van Codex binnen 20 seconden.'));},20000);this.pending.set(id,{resolve,reject,timer});this.proc.stdin.write(JSON.stringify({id,method,...(params?{params}:{})})+'\n');});}
 close(){this.proc?.kill();}
}
module.exports={Client};
if(require.main===module){(async()=>{const c=new Client();try{await c.start();const r=await c.call('account/rateLimits/read');console.log(JSON.stringify({rateLimits:r.rateLimits,rateLimitsByLimitId:r.rateLimitsByLimitId}));}catch(e){console.error(e.message);process.exitCode=1;}finally{c.close();}})();}
