const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

exports.run = async (win, app, meterTray) => {
  const output = path.join(app.getAppPath(), 'windows', 'tray-check');
  fs.mkdirSync(output, { recursive: true });
  const checks = [];
  const check = (condition, name) => { assert.ok(condition, name); checks.push(name); };
  const frame = () => new Promise(resolve => setTimeout(resolve, 150));
  let result;
  try {
    check(!meterTray.inspect().tray.isDestroyed(), 'Native tray icon created');
    await win.webContents.executeJavaScript(`document.querySelector('[data-language="en"]').click()`);
    await frame();
    check(meterTray.inspect().menu.items[1].label === 'Open Codex Meter', 'Tray menu follows English UI selection');
    await win.webContents.executeJavaScript(`document.querySelector('[data-language="nl"]').click()`);
    await frame();
    check(meterTray.inspect().menu.items[1].label === 'Codex Meter openen', 'Tray menu follows Dutch UI selection');
    meterTray.update({ updated: Date.now(), data: { rateLimits: { primary: { usedPercent: 23 } } } });
    check(meterTray.inspect().tooltip.includes('77% over'), 'Tooltip displays remaining allowance');
    win.close();
    await frame();
    check(!win.isDestroyed() && !win.isVisible(), 'Closing hides the window without destroying it');
    meterTray.inspect().tray.emit('click');
    await frame();
    check(win.isVisible(), 'Tray click restores the window');
    await win.webContents.executeJavaScript(`document.getElementById('hide').click()`);
    await frame();
    check(!win.isVisible(), 'Hide-to-tray button hides the window');
    meterTray.inspect().menu.items[1].click();
    await frame();
    check(win.isVisible(), 'Open menu item restores the window');
    meterTray.update({ error: 'offline' });
    check(meterTray.inspect().tooltip.includes('Verbinding onderbroken'), 'Offline tooltip does not claim live readings');
    result = { ok: true, checks };
  } catch (error) { result = { ok: false, checks, error: error.message }; process.exitCode = 1; }
  app.once('will-quit', () => {
    result.iconDestroyedOnQuit = meterTray.inspect().tray.isDestroyed();
    result.ok = result.ok && result.iconDestroyedOnQuit;
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
  });
  meterTray.inspect().menu.items.at(-1).click();
};
