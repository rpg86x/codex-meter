const {app,BrowserWindow,ipcMain,screen,safeStorage,clipboard}=require('electron');
const path=require('node:path');
const {Client}=require('./client.cjs');
const languageTest=process.argv.includes('--language-test');
const trayTest=process.argv.includes('--tray-test');
const syncTest=process.argv.includes('--sync-test');
if(languageTest||trayTest||syncTest){const fs=require('node:fs');const profile=path.join(app.getAppPath(),'windows',syncTest?'sync-test-profile':trayTest?'tray-test-profile':'language-test-profile');fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);}
let win,client,busy=false,state={data:null,updated:null,error:null},timer,meterTray,sync;
async function refresh(){if(busy)return state;busy=true;try{if(sync?.remote()){state={...await sync.read(),source:'remote'};}else{if(!client||client.dead){client?.close();client=new Client();await client.start();}const data=await client.call('account/rateLimits/read');state={data,updated:Date.now(),error:null};}}catch(e){state={...state,error:sync?.remote()?'sync_unavailable':e.message};client?.close();client=null;}finally{busy=false;if(win&&!win.isDestroyed())win.webContents.send('state',state);meterTray?.update(state);}return state;}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(meterTray)meterTray.show();else{win?.restore();win?.show();win?.focus();}});
 app.whenReady().then(async()=>{
  sync=require('./sync-controller.cjs').createSync({app,safeStorage,readState:()=>state,changed:async()=>{while(busy)await new Promise(r=>setTimeout(r,50));client?.close();client=null;state={data:null,updated:null,error:null};await refresh();}});
  if(!languageTest&&!trayTest&&!syncTest)await sync.start();
  win=new BrowserWindow({width:430,height:790,minWidth:350,minHeight:520,title:'Codex Meter',icon:path.join(__dirname,'logo.png'),backgroundColor:'#101719',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
  meterTray=require('./tray.cjs').createMeterTray({win,app,refresh});
  ipcMain.handle('tray-language',(_,language)=>meterTray.setLanguage(language));
  ipcMain.handle('tray-hide',()=>meterTray.hide());
  ipcMain.handle('state',()=>state);ipcMain.handle('refresh',refresh);
  let configuring=false;
  ipcMain.handle('sync-info',()=>sync.info());
  ipcMain.handle('sync-mode',async(_,mode,code)=>{if(configuring)return {error:'sync_busy'};configuring=true;try{return await sync.setMode(mode,code);}catch(e){return {error:['sync_code_invalid','sync_storage_error','sync_unavailable'].includes(e.message)?e.message:'sync_unavailable'};}finally{configuring=false;}});
  ipcMain.handle('sync-code',(_,host)=>{try{const code=sync.code(host);clipboard.writeText(code);return {ok:true};}catch{return {error:'sync_listen_error'};}});
  ipcMain.handle('pin',()=>{win.setAlwaysOnTop(!win.isAlwaysOnTop());return win.isAlwaysOnTop();});
  ipcMain.handle('size',(_,half)=>{const a=screen.getDisplayMatching(win.getBounds()).workArea;win.setBounds(half?{x:a.x+Math.floor(a.width/2),y:a.y,width:Math.ceil(a.width/2),height:a.height}:{x:a.x+a.width-430,y:a.y,width:430,height:Math.min(790,a.height)});});
  if(languageTest){win.webContents.once('did-finish-load',()=>require('./language-test.cjs').run(win,app));}
  if(trayTest){win.webContents.once('did-finish-load',()=>require('./tray-test.cjs').run(win,app,meterTray));}
  if(syncTest){win.webContents.once('did-finish-load',()=>require('./sync-app-test.cjs').run(win,app,()=>!!client));}
  win.loadFile('index.html');if(!languageTest&&!trayTest&&!syncTest){refresh();timer=setInterval(refresh,30000);}
  if(process.argv.includes('--smoke-test'))win.webContents.once('did-finish-load',async()=>{await refresh();const deadline=Date.now()+25000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,1500));const fs=require('node:fs');fs.writeFileSync(path.join(app.getAppPath(),'smoke-result.json'),JSON.stringify({ok:!!state.data,error:state.error}));fs.writeFileSync(path.join(app.getAppPath(),'preview.png'),(await win.webContents.capturePage()).toPNG());app.quit();});
 });
 app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{clearInterval(timer);client?.close();sync?.stop();});
}
