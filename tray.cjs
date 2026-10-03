const path = require('node:path');
const fs = require('node:fs');
const { Tray, Menu, nativeImage } = require('electron');
const languages = require('./languages.js');

exports.createMeterTray = ({ win, app, refresh }) => {
  let language = 'nl', state = {}, quitting = false, menu, tooltip;
  const ico = path.join(path.dirname(app.getPath('exe')), 'codex-meter.ico');
  const icon = fs.existsSync(ico) ? ico : nativeImage.createFromPath(path.join(__dirname, 'logo.png')).resize({ width: 32, height: 32 });
  const tray = new Tray(icon);
  function text(key) { return languages[language][key] ?? languages.en[key]; }
  function show() {
    if (win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
  function update() {
    if (tray.isDestroyed()) return;
    const bucket = state.data?.rateLimitsByLimitId?.codex || state.data?.rateLimits;
    const used = bucket?.primary?.usedPercent;
    const remaining = typeof used === 'number' && Number.isFinite(used)
      ? text('remaining').replace('{value}', Math.round(Math.max(0, Math.min(100, 100 - used)))) : '';
    const status = state.error ? text('disconnected') : state.updated ? remaining : text('connecting');
    tooltip = 'Codex Meter' + (status ? ' · ' + status : '');
    tray.setToolTip(tooltip);
    menu = Menu.buildFromTemplate([
      { label: 'Codex Meter', enabled: false },
      { label: text('trayOpen'), click: show },
      { label: text('refresh'), click: () => { void refresh(); } },
      { type: 'separator' },
      { label: text('trayQuit'), click: () => app.quit() }
    ]);
    tray.setContextMenu(menu);
  }
  tray.on('click', show);
  tray.on('double-click', show);
  win.on('close', event => {
    if (!quitting && !tray.isDestroyed()) { event.preventDefault(); win.hide(); }
  });
  app.on('before-quit', () => { quitting = true; tray.destroy(); });
  update();
  return {
    show,
    hide: () => { if (!tray.isDestroyed()) win.hide(); },
    update: next => { state = next; update(); },
    setLanguage: next => { if (Object.hasOwn(languages, next)) { language = next; update(); } },
    // Exposed only inside the main process for lifecycle checks.
    inspect: () => ({ tray, menu, tooltip, quitting })
  };
};
