const {app,BrowserWindow,ipcMain,screen}=require('electron');
const path=require('node:path');
const {Client}=require('./client.cjs');
let win,client,busy=false,state={data:null,updated:null,error:null},timer;
async function refresh(){if(busy)return state;busy=true;try{if(!client||client.dead){client?.close();client=new Client();await client.start();}const data=await client.call('account/rateLimits/read');state={data,updated:Date.now(),error:null};}catch(e){state={...state,error:e.message};client?.close();client=null;}finally{busy=false;if(win&&!win.isDestroyed())win.webContents.send('state',state);}return state;}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{win?.restore();win?.focus();});
 app.whenReady().then(()=>{
  win=new BrowserWindow({width:430,height:790,minWidth:350,minHeight:520,title:'Codex Meter',icon:path.join(__dirname,'logo.png'),backgroundColor:'#101719',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
  ipcMain.handle('state',()=>state);ipcMain.handle('refresh',refresh);
  ipcMain.handle('pin',()=>{win.setAlwaysOnTop(!win.isAlwaysOnTop());return win.isAlwaysOnTop();});
  ipcMain.handle('size',(_,half)=>{const a=screen.getDisplayMatching(win.getBounds()).workArea;win.setBounds(half?{x:a.x+Math.floor(a.width/2),y:a.y,width:Math.ceil(a.width/2),height:a.height}:{x:a.x+a.width-430,y:a.y,width:430,height:Math.min(790,a.height)});});
  win.loadFile('index.html');refresh();timer=setInterval(refresh,30000);
  if(process.argv.includes('--smoke-test'))win.webContents.once('did-finish-load',async()=>{await refresh();const deadline=Date.now()+25000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,1500));const fs=require('node:fs');fs.writeFileSync(path.join(app.getAppPath(),'smoke-result.json'),JSON.stringify({ok:!!state.data,error:state.error}));fs.writeFileSync(path.join(app.getAppPath(),'preview.png'),(await win.webContents.capturePage()).toPNG());app.quit();});
 });
 app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{clearInterval(timer);client?.close();});
}
