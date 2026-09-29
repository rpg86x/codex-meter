// Run with: electron . --language-test
// Uses an isolated profile and synthetic readings, never your account data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dictionaries = require('./languages.js');

exports.run = async (win, app) => {
  const output = path.join(app.getAppPath(), 'windows', 'language-check');
  fs.mkdirSync(output, { recursive: true });
  const checks = [];
  const js = script => win.webContents.executeJavaScript(script);
  const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
  const reading = {
    updated: Date.now(), error: null,
    data: { rateLimits: { planType: 'plus', credits: { balance: '12.5' },
      primary: { usedPercent: 23, windowDurationMins: 300, resetsAt: Math.floor(Date.now()/1000)+3600 },
      secondary: { usedPercent: 48, windowDurationMins: 10080, resetsAt: Math.floor(Date.now()/1000)+86400 }
    } }
  };
  try {
    assert.deepEqual(Object.keys(dictionaries.nl).sort(), Object.keys(dictionaries.en).sort());
    checks.push('Both dictionaries have the same translation keys');
    await js(`render(${JSON.stringify(reading)})`);
    for (const language of ['en', 'nl']) {
      await js(`document.querySelector('[data-language="${language}"]').click()`);
      const result = await js(`({lang:document.documentElement.lang,text:document.body.innerText,selected:document.querySelector('[data-language="${language}"]').getAttribute('aria-pressed'),flags:[...document.querySelectorAll('.languages img')].every(i=>i.complete&&i.naturalWidth>0),credits:document.getElementById('credits').textContent})`);
      check(result.lang === language && result.selected === 'true', language + ': flag switches language and selected state');
      check(result.flags, language + ': both flag images loaded');
      check(result.text.includes(language === 'en' ? '77% left' : '77% over'), language + ': remaining allowance translated');
      check(result.text.includes(dictionaries[language].resetLabel), language + ': reset label translated');
      check(result.text.includes(language === 'en' ? 'remaining' : 'Nog '), language + ': countdown translated');
      check(result.credits === (language === 'en' ? '12.5' : '12,5'), language + ': balance number formatting');
      check(!result.text.includes(language === 'en' ? 'Wordt gereset op' : 'Resets on'), language + ': previous language removed');
      await js(`document.getElementById('pin').click()`);
      await js('new Promise(resolve=>setTimeout(resolve,100))');
      await js(`document.querySelector('[data-language="${language === 'en' ? 'nl' : 'en'}"]').click();document.querySelector('[data-language="${language}"]').click()`);
      check(await js(`document.getElementById('pin').textContent===t(pinned?'pinned':'pin')`), language + ': pin state survives language change');
      await js(`render({...state,error:'Geen antwoord van Codex binnen 20 seconden.'})`);
      check(await js(`document.getElementById('error').textContent===t('timeoutError')`), language + ': timeout translated');
      await js(`render(${JSON.stringify(reading)})`);
      await win.webContents.capturePage().then(image => fs.writeFileSync(path.join(output, language + '.png'), image.toPNG()));
    }
    await js(`document.querySelector('[data-language="en"]').click()`);
    await win.loadFile(path.join(app.getAppPath(), 'index.html'));
    check(await js(`document.documentElement.lang==='en'&&localStorage.getItem('codex-meter-language')==='en'`), 'Language remains English after page reload');
    await js(`render({data:null,updated:null,error:'Codex-verbinding gesloten.'})`);
    check(await js(`document.getElementById('error').textContent===t('connectionError')&&document.getElementById('updated').textContent==='No reading yet'`), 'English error and empty state');
    await js(`render({data:{rateLimits:{}},updated:Date.now(),error:null})`);
    check(await js(`document.getElementById('buckets').innerText==='No limits available.'&&document.getElementById('credits').textContent==='—'`), 'Missing data stays unknown');
    await js(`render(${JSON.stringify(reading)})`);
    win.setSize(350, 700);
    await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth'), 'No horizontal overflow at minimum width');
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ ok: true, checks }, null, 2));
  } catch (error) {
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ ok: false, checks, error: error.message }, null, 2));
    process.exitCode = 1;
  } finally { app.quit(); }
};
