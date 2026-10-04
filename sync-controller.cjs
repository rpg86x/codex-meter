const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const transport=require('./sync.cjs');
exports.createSync = ({app,safeStorage,readState,changed}) => {
  const file=path.join(app.getPath('userData'),'meter-sync.bin');
  let config={mode:'local'},server,problem=null;
  try {if(fs.existsSync(file))config=JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));} catch {problem='sync_storage_error';}
  function save(next) {
    if(!safeStorage.isEncryptionAvailable())throw Error('sync_storage_error');
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file+'.tmp',safeStorage.encryptString(JSON.stringify(next)));
    fs.renameSync(file+'.tmp',file);config=next;
  }
  function stop(){if(server){server.close();server.closeAllConnections();server=null;}}
  async function start(){
    stop();
    if(config.mode!=='source')return;
    const next=transport.createHost(config.key,readState);
    try{await new Promise((resolve,reject)=>{next.once('error',reject);next.listen(transport.PORT,'0.0.0.0',resolve);});server=next;problem=null;}
    catch{next.close();problem='sync_listen_error';}
  }
  function info(){return {mode:config.mode,addresses:transport.addresses(),sharing:!!server,error:problem,host:config.remote?.host};}
  return {
    start,stop,info,
    remote:()=>config.mode==='remote',read:()=>transport.readRemote(config.remote),
    async setMode(mode,code){
      if(!['local','source','remote'].includes(mode))throw Error('sync_code_invalid');
      const next=mode==='remote'?{mode,remote:transport.parseCode(code)}:mode==='source'?{mode,key:crypto.randomBytes(32).toString('base64url')}:{mode};
      // Verify the source before replacing a working configuration.
      if(mode==='remote')await transport.readRemote(next.remote);
      save(next);await start();await changed();return info();
    },
    code(host){if(!server || !transport.addresses().includes(host))throw Error('sync_listen_error');return transport.makeCode(host,config.key);}
  };
};
