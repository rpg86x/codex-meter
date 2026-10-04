const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createHost,makeCode}=require('./sync.cjs');
exports.run=async(win,app,hasClient)=>{
 const dir=path.join(app.getAppPath(),'windows','sync-check');fs.mkdirSync(dir,{recursive:true});
 const key=crypto.randomBytes(32).toString('base64url'),checks=[];
 const reading={data:{rateLimits:{planType:'plus',credits:{balance:'12.5'},primary:{usedPercent:23,windowDurationMins:300,resetsAt:Math.floor(Date.now()/1000)+3600}}},updated:Date.now(),error:null};
 const host=createHost(key,()=>reading),js=code=>win.webContents.executeJavaScript(code);
 const check=(condition,name)=>{assert.ok(condition,name);checks.push(name);};
 try{
  await new Promise((resolve,reject)=>{host.once('error',reject);host.listen(43127,'127.0.0.1',resolve);});
  await js('new Promise(r=>setTimeout(r,250))');
  await js(`document.getElementById('sync-panel').open=true;document.getElementById('sync-input').value=${JSON.stringify(makeCode('127.0.0.1',key))};document.getElementById('sync-form').requestSubmit()`);
  for(let i=0;i<80;i++){if(await js(`state.updated===${reading.updated} && !document.getElementById('sync-local').disabled`))break;await new Promise(r=>setTimeout(r,100));}
  check(await js(`document.querySelector('h1').textContent==='Codex Meter Sync'`),'Pairing form switches to receiver mode');
  check(!hasClient(),'Receiver does not start Codex');
  check(await js(`document.getElementById('buckets').textContent.includes('77%')`),'Receiver renders source quota');
  check(await js(`document.getElementById('sync-input').value===''`),'Pairing code cleared after submission');
  check(fs.readFileSync(path.join(app.getPath('userData'),'meter-sync.bin'),'utf8').indexOf(key)===-1,'Saved pairing is not plaintext');
  for(const language of ['nl','en']){await js(`setLanguage('${language}')`);check(await js(`document.getElementById('sync-state').textContent.includes('127.0.0.1')`),language+': source address retained on language switch');}
  const updated=await js('state.updated');host.closeAllConnections();await new Promise(r=>host.close(r));
  await js(`window.meter.refresh().then(render)`);
  check(await js(`state.updated===${updated}&&state.error==='sync_unavailable'&&document.getElementById('buckets').textContent.includes('77%')`),'Offline source preserves timestamp and reading with an error');
  await win.webContents.capturePage().then(image=>fs.writeFileSync(path.join(dir,'receiver.png'),image.toPNG()));
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({ok:true,checks},null,2));
 }catch(error){fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({ok:false,checks,error:error.message},null,2));process.exitCode=1;}
 finally{host.closeAllConnections();host.close();app.quit();}
};
