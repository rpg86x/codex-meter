const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

if (process.platform !== 'win32') throw new Error('Bouw deze app op Windows.');
const root = __dirname;
const runtime = path.join(path.dirname(require.resolve('electron/package.json')), 'dist');
const output = path.join(root, 'windows');
const appDir = path.join(output, 'resources', 'app');
if (!fs.existsSync(path.join(runtime, 'electron.exe'))) {
  throw new Error('Electron-runtime ontbreekt. Voer eerst npm install uit.');
}
fs.mkdirSync(appDir, { recursive: true });
for (const entry of fs.readdirSync(runtime, { withFileTypes: true })) {
  if (entry.name === 'resources') continue;
  const targetName = entry.name === 'electron.exe' ? 'Codex Meter.exe' : entry.name;
  fs.cpSync(path.join(runtime, entry.name), path.join(output, targetName), { recursive: true });
}
for (const file of ['main.cjs', 'client.cjs', 'preload.cjs', 'renderer.js', 'languages.js', 'language-test.cjs', 'tray.cjs', 'tray-test.cjs', 'flag-nl.svg', 'flag-en.svg', 'index.html', 'style.css', 'logo.png', 'package.json', 'LEESMIJ.md']) {
  fs.copyFileSync(path.join(root, file), path.join(appDir, file));
}
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'build-icon.ps1')], { stdio: 'inherit', windowsHide: true });
console.log(`Windows-app klaar: ${path.join(output, 'Codex Meter.exe')}`);
