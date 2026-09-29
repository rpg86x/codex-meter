const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('meter',{state:()=>ipcRenderer.invoke('state'),refresh:()=>ipcRenderer.invoke('refresh'),pin:()=>ipcRenderer.invoke('pin'),size:half=>ipcRenderer.invoke('size',half),subscribe:fn=>ipcRenderer.on('state',(_,value)=>fn(value))});
