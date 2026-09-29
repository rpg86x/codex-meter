// Add translations here, then add a language button in index.html.
const meterLanguages = {
  nl: {
    locale: 'nl-NL', name: 'Nederlands', hourUnit: 'u',
    tagline: 'Jouw ruimte om te bouwen', language: 'Taal kiezen', refresh: 'Nu vernieuwen',
    allowance: 'Nog beschikbaar in je abonnement', loading: 'Je limieten worden opgehaald.',
    creditsTitle: 'EXTRA CREDITTEGOED', creditsLoading: 'Tegoed ophalen…',
    explanation: 'Je abonnementsruimte wordt als percentage gemeten. Dit is geen vast aantal berichten of eurobedrag.',
    automatic: 'Automatisch elke 30 seconden · cijfers van Codex',
    separate: 'Abonnementsruimte en extra credits zijn afzonderlijke tegoeden.',
    connecting: 'Verbinding maken…', connected: 'Verbonden met Codex', disconnected: 'Verbinding onderbroken',
    creditsUnavailable: 'Credittegoed niet beschikbaar', unlimited: 'Onbeperkt tegoed', creditsNote: 'Beschikbaar naast je abonnement',
    noLimits: 'Geen limieten beschikbaar.', unknownUsage: 'Verbruik onbekend',
    remaining: '{value}% over', used: '{value}% verbruikt', week: 'Week', days: '{value} dagen', hours: '{value} uur', minutes: '{value} minuten',
    resetLabel: 'Wordt gereset op', resetUnknown: 'Resetmoment niet beschikbaar', countdown: 'Nog {time}',
    resetReached: 'Resetmoment bereikt · nieuwe meting afwachten', lastUpdated: 'Laatste meting {time}', stale: ' · verouderd', noReading: 'Nog geen meting',
    pin: 'Bovenop houden', pinned: 'Bovenop: aan', half: 'Half scherm', compact: 'Smal venster',
    connectionError: 'Geen verbinding met Codex. Controleer of Codex is geïnstalleerd en je bent aangemeld.',
    timeoutError: 'Geen antwoord van Codex binnen 20 seconden. Probeer opnieuw.',
    genericError: 'Gegevens konden niet worden opgehaald. Controleer je Codex-aanmelding en internetverbinding.',
    actionError: 'De actie is niet gelukt. Probeer opnieuw.'
  },
  en: {
    locale: 'en-GB', name: 'English', hourUnit: 'h',
    tagline: 'Your room to build', language: 'Choose language', refresh: 'Refresh now',
    allowance: 'Remaining in your plan', loading: 'Fetching your limits.',
    creditsTitle: 'EXTRA CREDIT BALANCE', creditsLoading: 'Fetching balance…',
    explanation: 'Your plan allowance is measured as a percentage. It is not a fixed number of messages or a monetary balance.',
    automatic: 'Updates every 30 seconds · figures from Codex',
    separate: 'Plan allowance and extra credits are separate balances.',
    connecting: 'Connecting…', connected: 'Connected to Codex', disconnected: 'Connection interrupted',
    creditsUnavailable: 'Credit balance unavailable', unlimited: 'Unlimited balance', creditsNote: 'Available alongside your plan',
    noLimits: 'No limits available.', unknownUsage: 'Usage unknown',
    remaining: '{value}% left', used: '{value}% used', week: 'Week', days: '{value} days', hours: '{value} hours', minutes: '{value} minutes',
    resetLabel: 'Resets on', resetUnknown: 'Reset time unavailable', countdown: '{time} remaining',
    resetReached: 'Reset time reached · waiting for a new reading', lastUpdated: 'Last updated {time}', stale: ' · out of date', noReading: 'No reading yet',
    pin: 'Always on top', pinned: 'On top: on', half: 'Half screen', compact: 'Compact window',
    connectionError: 'Cannot connect to Codex. Check that Codex is installed and you are signed in.',
    timeoutError: 'No response from Codex within 20 seconds. Please try again.',
    genericError: 'Could not fetch your data. Check your Codex sign-in and internet connection.',
    actionError: 'The action failed. Please try again.'
  }
};
if (typeof module !== 'undefined') module.exports = meterLanguages;
