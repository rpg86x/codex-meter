let state = {}, half = false, pinned = false, language = 'nl';
const $ = id => document.getElementById(id);
try {
  const saved = localStorage.getItem('codex-meter-language');
  if (Object.hasOwn(meterLanguages, saved)) language = saved;
} catch { /* The app still works when storage is unavailable. */ }

function t(key, values = {}) {
  const text = meterLanguages[language][key] ?? meterLanguages.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
function number(value) { return new Intl.NumberFormat(meterLanguages[language].locale).format(value); }
function el(tag, cls, text) {
  const element = document.createElement(tag);
  element.className = cls;
  if (text !== undefined) element.textContent = text;
  return element;
}
function duration(minutes) {
  if (minutes === 10080) return t('week');
  if (minutes >= 1440) return t('days', { value: number(minutes / 1440) });
  if (minutes >= 60) return t('hours', { value: number(minutes / 60) });
  return t('minutes', { value: number(minutes) });
}
function updateControls() {
  $('pin').textContent = t(pinned ? 'pinned' : 'pin');
  $('pin').setAttribute('aria-pressed', String(pinned));
  $('size').textContent = t(half ? 'compact' : 'half');
}
function setLanguage(next) {
  if (!Object.hasOwn(meterLanguages, next)) return;
  language = next;
  window.meter.setLanguage?.(next).catch(() => {});
  try { localStorage.setItem('codex-meter-language', next); } catch {}
  document.documentElement.lang = next;
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-language]').forEach(e => { e.setAttribute('aria-pressed', String(e.dataset.language === next)); });
  $('languages').setAttribute('aria-label', t('language'));
  $('refresh').title = t('refresh');
  $('refresh').setAttribute('aria-label', t('refresh'));
  updateControls();
  render(state);
}
function errorText(error) {
  if (error?.startsWith('sync_')) return t(error);
  if (error === 'connection_closed' || error?.startsWith('Codex-verbinding gesloten.')) return t('connectionError');
  if (error === 'request_timeout' || error?.startsWith('Geen antwoord van Codex')) return t('timeoutError');
  return t(error === 'action_failed' ? 'actionError' : 'genericError');
}
function render(nextState) {
  state = nextState;
  $('error').hidden = !state.error;
  $('error').textContent = state.error ? errorText(state.error) : '';
  $('status').textContent = t(state.error ? 'disconnected' : state.updated ? (state.source==='remote'?'syncConnected':'connected') : 'connecting');
  $('dot').style.background = state.error ? '#e9b36c' : state.updated ? '#95e3b1' : '#7a8c87';
  if (!state.data) {
    $('credits').textContent = '—'; $('plan').textContent = '—';
    $('buckets').replaceChildren(el('section', 'card', t('loading')));
    $('creditnote').textContent = t('creditsLoading');
    tick();
    return;
  }
  const all = state.data.rateLimitsByLimitId;
  const buckets = all && Object.keys(all).length
    ? Object.entries(all).sort(([a], [b]) => Number(b === 'codex') - Number(a === 'codex'))
    : [['codex', state.data.rateLimits]];
  const main = all?.codex || state.data.rateLimits;
  const reserve = state.data.lunaReserve || main?.lunaReserve || main?.luna_reserve;
  const credits = main?.credits;
  $('plan').textContent = main?.planType || 'Codex';
  const balance = credits?.balance;
  $('credits').textContent = credits?.unlimited ? '∞' : balance == null ? '—'
    : String(balance).trim() !== '' && Number.isFinite(Number(balance)) ? number(Number(balance)) : balance;
  $('creditnote').textContent = t(!credits ? 'creditsUnavailable' : credits.unlimited ? 'unlimited' : 'creditsNote');
  const reserveCard = $('luna-reserve');
  reserveCard.hidden = !reserve;
  if (reserve) {
    reserveCard.querySelector('.reserve-value').textContent = reserve.unlimited ? '∞' : reserve.balance == null ? '—' : number(Number(reserve.balance));
    reserveCard.querySelector('.reserve-note').textContent = t('lunaReserveNote');
  }
  $('buckets').replaceChildren();
  for (const [id, bucket] of buckets) {
    if (!bucket) continue;
    for (const quota of [bucket.primary, bucket.secondary]) {
      if (!quota) continue;
      const valid = typeof quota.usedPercent === 'number' && Number.isFinite(quota.usedPercent);
      const left = valid ? Math.max(0, Math.min(100, 100 - quota.usedPercent)) : null;
      const remaining = left === null ? '—' : t('remaining', { value: number(Math.round(left)) });
      const card = el('section', 'card');
      const top = el('div', 'card-top');
      top.append(el('h2', '', (id === 'codex' ? 'Codex' : bucket.limitName || id) + ' · ' + duration(quota.windowDurationMins)), el('span', 'percent', remaining));
      const bar = el('div', 'bar');
      const fill = el('div', 'fill');
      fill.style.width = (left ?? 0) + '%';
      if (left !== null && left < 20) fill.style.background = '#efb86d';
      bar.append(fill);
      const meta = el('div', 'meta');
      meta.append(el('span', '', valid ? t('used', { value: number(quota.usedPercent) }) : t('unknownUsage')), el('span', '', left === null ? '' : remaining));
      const reset = el('p', 'reset', t('resetUnknown'));
      if (quota.resetsAt) reset.dataset.reset = quota.resetsAt;
      card.append(top, bar, meta, reset);
      $('buckets').append(card);
    }
  }
  if (!$('buckets').children.length) $('buckets').append(el('section', 'card', t('noLimits')));
  tick();
}
function tick() {
  const locale = meterLanguages[language].locale;
  $('updated').textContent = state.updated
    ? t('lastUpdated', { time: new Date(state.updated).toLocaleTimeString(locale) }) + (Date.now() - state.updated > 65000 ? t('stale') : '')
    : t('noReading');
  for (const element of document.querySelectorAll('[data-reset]')) {
    const timestamp = Number(element.dataset.reset) * 1000;
    const seconds = Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
    const days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), minutes = Math.floor(seconds % 3600 / 60);
    const time = (days ? days + 'd ' : '') + hours + t('hourUnit') + ' ' + minutes + 'm ' + seconds % 60 + 's';
    const date = new Date(timestamp).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    element.replaceChildren(el('span', 'reset-label', t('resetLabel')), el('span', 'reset-date', date), el('span', 'countdown', seconds ? t('countdown', { time }) : t('resetReached')));
  }
}
function actionFailed() { render({ ...state, error: 'action_failed' }); }
$('refresh').onclick = async () => {
  $('refresh').disabled = true;
  try { render(await window.meter.refresh()); } catch { actionFailed(); }
  finally { $('refresh').disabled = false; }
};
$('pin').onclick = async () => {
  try { pinned = await window.meter.pin(); updateControls(); } catch { actionFailed(); }
};
$('size').onclick = async () => {
  try { await window.meter.size(!half); half = !half; updateControls(); } catch { actionFailed(); }
};
$('hide').onclick = () => window.meter.hide().catch(actionFailed);
document.querySelectorAll('[data-language]').forEach(button => { button.onclick = () => setLanguage(button.dataset.language); });
setLanguage(language);
window.meter.subscribe(render);
window.meter.state().then(render).catch(actionFailed);
setInterval(tick, 1000);


