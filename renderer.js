let state={},half=false;const $=id=>document.getElementById(id);
function el(tag,cls,text){const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function duration(m){if(m===300)return '5 uur';if(m===10080)return 'Week';return m>=1440?`${m/1440} dagen`:m>=60?`${m/60} uur`:`${m} minuten`;}
function render(s){state=s;$('error').hidden=!s.error;$('error').textContent=s.error||'';$('status').textContent=s.error?'Verbinding onderbroken':s.updated?'Verbonden met Codex':'Verbinding maken…';$('dot').style.background=s.error?'#e9b36c':s.updated?'#95e3b1':'#7a8c87';
 if(!s.data)return;const all=s.data.rateLimitsByLimitId;const buckets=all&&Object.keys(all).length?Object.entries(all).sort(([a],[b])=>a==='codex'?-1:b==='codex'?1:0):[['codex',s.data.rateLimits]];const main=all?.codex||s.data.rateLimits;const c=main?.credits;
 $('plan').textContent=main?.planType||'Codex';$('credits').textContent=c?.unlimited?'∞':c?.balance??'—';$('creditnote').textContent=!c?'Credittegoed niet beschikbaar':c.unlimited?'Onbeperkt tegoed':'Beschikbaar naast je abonnement';$('buckets').replaceChildren();
 for(const [id,b]of buckets){if(!b)continue;for(const w of [b.primary,b.secondary]){if(!w)continue;const valid=typeof w.usedPercent==='number'&&Number.isFinite(w.usedPercent);const left=valid?Math.max(0,Math.min(100,100-w.usedPercent)):null;const card=el('section','card');const top=el('div','card-top');top.append(el('h2','',`${id==='codex'?'Codex':b.limitName||id} · ${duration(w.windowDurationMins)}`),el('span','percent',left===null?'—':`${Math.round(left)}% over`));const bar=el('div','bar');const fill=el('div','fill');fill.style.width=`${left??0}%`;if(left!==null&&left<20)fill.style.background='#efb86d';bar.append(fill);const meta=el('div','meta');meta.append(el('span','',valid?`${w.usedPercent}% verbruikt`:'Verbruik onbekend'),el('span','',left===null?'':`${Math.round(left)}% over`));card.append(top,bar,meta);if(w.resetsAt){const p=el('p','reset');p.dataset.reset=w.resetsAt;card.append(p);} $('buckets').append(card);}}
 if(!$('buckets').children.length)$('buckets').append(el('section','card','Geen limieten beschikbaar.'));tick();}
function tick(){
 if(state.updated)$('updated').textContent=`Laatste meting ${new Date(state.updated).toLocaleTimeString('nl-NL')}${Date.now()-state.updated>65000?' · verouderd':''}`;
 for(const e of document.querySelectorAll('[data-reset]')){
  const t=Number(e.dataset.reset)*1000;const seconds=Math.max(0,Math.ceil((t-Date.now())/1000));
  const d=Math.floor(seconds/86400),h=Math.floor(seconds%86400/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  const date=new Date(t).toLocaleString('nl-NL',{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  e.replaceChildren(el('span','reset-label','Wordt gereset op'),el('span','reset-date',date),el('span','countdown',seconds?`Nog ${d?d+'d ':''}${h}u ${m}m ${s}s`:'Resetmoment bereikt · nieuwe meting afwachten'));
 }
}
$('refresh').onclick=async()=>{$('refresh').disabled=true;try{render(await window.meter.refresh());}finally{$('refresh').disabled=false;}};
$('pin').onclick=async()=>{$('pin').textContent=await window.meter.pin()?'Bovenop: aan':'Bovenop houden';};$('size').onclick=()=>{half=!half;window.meter.size(half);$('size').textContent=half?'Smal venster':'Half scherm';};window.meter.subscribe(render);window.meter.state().then(render);setInterval(tick,1000);


