# Codex Meter

<img src="logo.png" alt="Codex Meter logo" width="112">

A compact Windows app that shows your remaining Codex allowance, extra credits, and when your limits reset.

## Download for Windows

[Download the Windows installer](https://github.com/rpg86x/codex-meter/releases/latest)

Under **Assets**, download `Codex-Meter-Setup-1.2.0-x64.exe`, open it, and follow the installation steps. The installer creates shortcuts on your desktop and in the Start menu.

Requires Windows x64 and an installed Codex desktop app with an active ChatGPT sign-in. **Node.js is not required to use the installer.**

The installer is not digitally signed, so Windows may display an unknown-publisher warning.

## Features

- Remaining subscription allowance for each limit, shown as a percentage.
- Reset dates and times with a countdown.
- Extra credit balance, when provided by Codex.
- A compact window, a half-screen mode, and an always-on-top option.
- A system tray icon next to the Windows clock: click to open, or right-click to refresh or quit.
- Dutch and English interface options, with your choice saved between sessions.

Closing the window hides it in the system tray while readings continue to update. The app refreshes every 30 seconds. Data from Codex may arrive with a delay. Subscription percentages do not represent a fixed number of messages or a monetary amount; extra credits are shown separately.

## Run from source

Requires Windows 11, Node.js with npm, and an installed Codex desktop app with an active ChatGPT sign-in.

```powershell
npm install
npm start
```

By default, the app looks for `codex.exe` under `%LOCALAPPDATA%\Programs\OpenAI\Codex\bin`. For a different installation, set the path in PowerShell before starting:

```powershell
$env:CODEX_METER_CLI = 'C:\path\to\codex.exe'
npm start
```

## Build a Windows installer

```powershell
npm install
npm run check
npm run build:installer
```

The installer is saved in `release`.

To build a portable app folder instead:

```powershell
npm run build:windows
```

Run `Codex Meter.exe` in the `windows` folder. Keep the entire folder together. To create a desktop shortcut:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\create-desktop-shortcut.ps1
```

Built app folders and test images are excluded from the repository. The build uses Electron from `node_modules` and preserves its bundled license files.

## Releases

The GitHub Actions workflow builds an installer when `package.json` changes on `main`, or when started manually. It publishes the installer and `SHA256SUMS.txt` as a GitHub Release using the version in `package.json`. Increase the version before publishing a new release.

You can link to [the latest release](https://github.com/rpg86x/codex-meter/releases/latest) from another website.

## Data and connection

The app requests limit data through the local [Codex app-server](https://learn.chatgpt.com/docs/app-server). It does not run AI prompts, read passwords or tokens itself, or store usage history. If the connection is lost, the last reading remains visible with its timestamp and an error message.

This is a personal project and is not an official OpenAI app.

## Interface language

Use the **NL** and **EN** flag buttons at the top to switch the entire interface, including reset dates, countdowns, controls, error messages, and the tray menu. Your choice is saved locally across restarts. Dutch is the default interface language.

### Add another language

Fork this project and add a translation to `languages.js` using the same keys as `en`. Set `locale`, `name`, and `hourUnit`. Add a button in `index.html` with a matching `data-language` code. Include any new flag asset in the file list in `build-windows.cjs`. Missing translations fall back to English.
