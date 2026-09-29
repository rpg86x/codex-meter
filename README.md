# Codex Meter

<img src="logo.png" alt="Codex Meter logo" width="112">

Een compacte Windows-app die laat zien hoeveel Codex-ruimte je nog hebt en wanneer je limieten worden gereset.

## Wat je ziet

- Resterende abonnementsruimte per limiet, als percentage.
- De datum en tijd van de reset, met een afteller.
- Extra credittegoed, wanneer Codex dat beschikbaar stelt.
- Een smal venster, een knop voor half scherm en een optie om bovenop te blijven.

De app ververst elke 30 seconden. De gegevens kunnen vanuit Codex vertraagd binnenkomen. Abonnementspercentages zijn geen vast aantal berichten of eurobedrag; extra credits worden afzonderlijk weergegeven.

## Zelf starten

Vereist Windows 11, Node.js met npm en een geïnstalleerde Codex-desktopapp met een actieve ChatGPT-aanmelding.

```powershell
npm install
npm start
```

Standaard zoekt de app `codex.exe` onder `%LOCALAPPDATA%\Programs\OpenAI\Codex\bin`. Voor een andere installatie kun je in PowerShell vóór het starten een pad instellen:

```powershell
$env:CODEX_METER_CLI = 'C:\pad\naar\codex.exe'
npm start
```

## Een Windows-appmap bouwen

```powershell
npm run check
npm run build:windows
```

Daarna staat `Codex Meter.exe` in de map `windows`. Bewaar die volledige map bij elkaar. Voor een bureaubladsnelkoppeling:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\create-desktop-shortcut.ps1
```

De gebouwde appmap en testbeelden staan niet in de repository. De bouwstap gebruikt Electron uit `node_modules` en behoudt diens meegeleverde licentiebestanden.

## Gegevens en koppeling

De app vraagt alleen limietgegevens op via de lokale [Codex app-server](https://learn.chatgpt.com/docs/app-server). Er worden geen AI-prompts uitgevoerd. De app leest zelf geen wachtwoorden of tokens en bewaart geen verbruikshistorie. Bij verbindingsverlies blijven de laatste meting, het tijdstip en een foutmelding zichtbaar.

Dit is een persoonlijk project en geen officiële OpenAI-app.
