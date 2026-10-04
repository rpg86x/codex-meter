Object.assign(meterLanguages.nl,{
  syncTitle:'Codex Meter Sync',syncHelp:'Kies op de pc met Codex ‘Delen vanaf deze pc’. Kopieer de koppelcode en plak die op de andere pc. Codex is alleen op de bron-pc nodig.',
  syncConnected:'Verbonden met bron-pc',syncRotate:'Nieuwe code · oude intrekken',syncLocal:'Alleen deze pc',syncSource:'Delen vanaf deze pc',syncRemote:'Verbinden met bron-pc',syncCopy:'Koppelcode kopiëren',syncJoin:'Koppelen',syncCode:'Koppelcode van de bron-pc',syncAddress:'Netwerkadres van deze pc',
  syncLocalState:'Lokale Codex-aanmelding',syncSourceState:'Deze pc deelt metingen',syncRemoteState:'Metingen van {host}',syncCopied:'Koppelcode gekopieerd. Bewaar hem privé. Deel hem alleen met je eigen apparaten.',syncSaved:'Instelling opgeslagen.',
  syncNote:'Beide computers moeten elkaar kunnen bereiken via hetzelfde netwerk of een VPN. De bron-pc moet aanstaan. Vernieuw ‘Delen’ om oude codes en verbindingen in te trekken. Bij een nieuw IP-adres kopieer je opnieuw een code.',
  syncFirewall:'Kan de andere pc niet verbinden? Sta Codex Meter in Windows Firewall toe op je vertrouwde privénetwerk (TCP 43127). Controleer ook de klok op beide computers.',
  sync_code_invalid:'Deze koppelcode is ongeldig. Kopieer de volledige code vanaf de bron-pc.',sync_unavailable:'Bron-pc niet bereikbaar of koppelcode ingetrokken. Controleer netwerk, firewall en of Codex Meter op de bron-pc aanstaat.',sync_source_error:'De bron-pc kan Codex momenteel niet uitlezen. De laatste meting blijft staan.',sync_storage_error:'De koppeling kon niet veilig worden opgeslagen. Probeer opnieuw.',sync_listen_error:'Delen kon niet starten. Mogelijk gebruikt een tweede Codex Meter dezelfde poort.',sync_busy:'Een andere verbindingsactie loopt nog.'
});
Object.assign(meterLanguages.en,{
  syncTitle:'Codex Meter Sync',syncHelp:'On the PC with Codex, choose “Share from this PC”. Copy the pairing code and paste it on the other PC. Only the source PC needs Codex.',
  syncConnected:'Connected to source PC',syncRotate:'New code · revoke old codes',syncLocal:'This PC only',syncSource:'Share from this PC',syncRemote:'Connect to source PC',syncCopy:'Copy pairing code',syncJoin:'Pair',syncCode:'Pairing code from source PC',syncAddress:'This PC’s network address',
  syncLocalState:'Local Codex sign-in',syncSourceState:'This PC is sharing readings',syncRemoteState:'Readings from {host}',syncCopied:'Pairing code copied. Keep it private and share it only with your own devices.',syncSaved:'Setting saved.',
  syncNote:'Both computers must be reachable over the same network or a VPN. The source PC must stay on. Select “Share” again to revoke old codes and connections. Copy a new code if the IP address changes.',
  syncFirewall:'Cannot connect? Allow Codex Meter through Windows Firewall on your trusted private network (TCP 43127). Also check both computers’ clocks.',
  sync_code_invalid:'Invalid pairing code. Copy the complete code from the source PC.',sync_unavailable:'Source PC unavailable or pairing code revoked. Check the network, firewall and that Codex Meter is running on the source PC.',sync_source_error:'The source PC cannot read Codex right now. The last reading is retained.',sync_storage_error:'Could not store the connection securely. Please try again.',sync_listen_error:'Sharing could not start. Another Codex Meter may be using the same port.',sync_busy:'Another connection action is still running.'
});
document.addEventListener('DOMContentLoaded',async()=>{
  if(!window.meter.syncInfo)return;
  const panel=document.createElement('details');panel.className='sync-panel';panel.id='sync-panel';
  panel.innerHTML='<summary data-i18n="syncTitle"></summary><p data-i18n="syncHelp"></p><p id="sync-state"></p><div class="sync-actions"><button id="sync-local" data-i18n="syncLocal"></button><button id="sync-source" data-i18n="syncSource"></button></div><div id="sync-sharing" hidden><label for="sync-address" data-i18n="syncAddress"></label><select id="sync-address"></select><button id="sync-copy" data-i18n="syncCopy"></button></div><form id="sync-form"><label for="sync-input" data-i18n="syncCode"></label><input id="sync-input" type="password" autocomplete="off" spellcheck="false" required maxlength="600"><button data-i18n="syncJoin"></button></form><p id="sync-message" role="status"></p><p data-i18n="syncNote"></p><p data-i18n="syncFirewall"></p>';
  document.querySelector('.status').before(panel);
  let info;
  const msg=key=>{const e=$('sync-message');e.dataset.i18n=key;e.textContent=t(key);};
  function show(value){info=value;$('sync-source').dataset.i18n=value.sharing?'syncRotate':'syncSource';$('sync-source').textContent=t($('sync-source').dataset.i18n);$('sync-sharing').hidden=!value.sharing;$('sync-state').dataset.i18n=value.mode==='remote'?'syncRemoteState':value.mode==='source'?'syncSourceState':'syncLocalState';$('sync-state').textContent=t($('sync-state').dataset.i18n,{host:value.host||''});document.querySelector('h1').textContent=value.mode==='remote'?'Codex Meter Sync':'Codex Meter';$('sync-address').replaceChildren(...value.addresses.map(address=>{const option=document.createElement('option');option.value=option.textContent=address;return option;}));if(value.error)msg(value.error);}
  const originalLanguage=setLanguage;setLanguage=next=>{originalLanguage(next);if(info)show(info);};
  async function mode(next,code){
    panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const value=await window.meter.syncMode(next,code);if(value.mode){show(value);msg(value.error||'syncSaved');if(next==='remote'&&!value.error)panel.open=false;}else msg(value.error);}
    catch{msg('sync_unavailable');}
    finally{panel.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  $('sync-local').onclick=()=>mode('local');$('sync-source').onclick=()=>mode('source');
  $('sync-form').onsubmit=e=>{e.preventDefault();const code=$('sync-input').value;$('sync-input').value='';void mode('remote',code);};
  $('sync-copy').onclick=async()=>{try{const r=await window.meter.syncCode($('sync-address').value);msg(r.error||'syncCopied');}catch{msg('sync_listen_error');}};
  setLanguage(language);
  try{show(await window.meter.syncInfo());}catch{msg('sync_unavailable');}
});
