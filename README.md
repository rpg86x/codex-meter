# Codex Meter

<img src="logo.png" alt="Codex Meter logo" width="112">

A compact Windows app that shows your remaining Codex allowance, extra credits, and when your limits reset.

## Download for Windows

[Download the Windows installer](https://github.com/rpg86x/codex-meter/releases/latest)

Under **Assets**, download `Codex-Meter-Setup-1.3.2-x64.exe`, open it, and follow the installation steps. The installer creates shortcuts on your desktop and in the Start menu.

Requires Windows x64. Local/source mode needs an installed Codex desktop app with an active ChatGPT sign-in. Sync receiver mode does not require Codex. **Node.js is not required to use the installer.**

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

## Codex Meter Sync: Acer to gaming PC

Install version 1.3.1 or later on both computers. On the Acer (with Codex signed in), open **Codex Meter Sync**, choose **Share from this PC**, select its reachable network address, and **Copy pairing code**. On the gaming PC, paste the full code into **Pairing code from source PC** and choose **Pair**. The title changes to Codex Meter Sync. Codex is not installed or started in receiver mode.

Both machines must be reachable over the same network or an existing VPN. The Acer and Codex Meter must stay running. Allow Codex Meter through Windows Firewall on the trusted private network (TCP 43127), if prompted. No firewall rule or router forwarding is created automatically. If there are multiple addresses, select the LAN or VPN address reachable from the receiver. If the source IP changes, copy a new code. Keep both system clocks accurate.

The pairing code contains the source address and a random 256-bit shared key; keep it private. Requests and responses use AES-256-GCM with distinct authenticated request/response contexts, fresh nonces, request IDs and replay protection. Transport is HTTP carrying authenticated encrypted envelopes, not plaintext usage or credentials. Only filtered quota snapshots are shared. Windows DPAPI (Electron safeStorage) encrypts the saved connection on disk. The code is copied to your clipboard only when requested; clear clipboard history if you use it. Codes remain valid until revoked.

Select **Share from this PC** again to rotate the key and disconnect all existing receivers. Choose **This PC only** to stop sharing or leave receiver mode. Last readings retain their original timestamp when the source goes offline; they are not fresh data. Preferences such as language and window size remain local. This is direct PC-to-PC snapshot sharing, without a cloud hosting subscription.

Run `npm run test:sync` for encrypted transport, authentication, replay, stale-data and filtering tests. A physical two-PC test is required for your firewall and network.


Luna Reserve is a separate quota in `rateLimitsByLimitId.base_model_inference` (reported as `gpt-reserve` with a Luna model). Version 1.3.2 shows its remaining percentage, usage bar and its own reset countdown in Dutch and English, including in Sync receiver mode. It is not a monetary or extra-credit balance. Missing usage is shown as unknown; an absent reserve bucket does not create a reserve card. Both PCs should use 1.3.2 or later. The previous 1.3.1 card relied on an unverified field and has been replaced.
