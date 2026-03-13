'use strict';
const { chromium } = require('playwright');

const FRONTEND = 'http://127.0.0.1:5173';
const OUT      = '/tmp/screenshots';
const { mkdirSync } = require('fs');
mkdirSync(OUT, { recursive: true });

(async () => {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 1: Landing / Dashboard ────────────────────────────────────────────────
  console.log('→ Loading', FRONTEND);
  await page.goto(FRONTEND, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/01_dashboard_home.png` });
  console.log('✅ 01_dashboard_home.png — Dashboard landing');

  // Log page structure  
  const bodyText = (await page.locator('body').innerText()).slice(0, 400);
  console.log('PAGE TEXT:', bodyText.replace(/\n/g, ' | '));

  // ── 2: Navigate to Leads ──────────────────────────────────────────────────
  const allEls = await page.locator('a, button, [role=button], [role=tab], nav *, header *').all();
  let leadsClicked = '';
  for (const el of allEls) {
    const txt = ((await el.textContent()) || '').toLowerCase().trim();
    if (txt.match(/^(leads?|contractors?|database)$/)) {
      try { await el.click({ timeout: 2000 }); leadsClicked = txt; break; } catch {}
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/02_leads_page.png` });
  const leadsText = (await page.locator('body').innerText()).slice(0, 200);
  console.log(`✅ 02_leads_page.png (clicked: "${leadsClicked}")`);
  console.log('   →', leadsText.replace(/\n/g, ' | '));

  // ── 3: Chat / AI ──────────────────────────────────────────────────────────
  await page.goto(FRONTEND, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const allEls2 = await page.locator('a, button, [role=button], [role=tab], nav *, aside *').all();
  let chatClicked = '';
  for (const el of allEls2) {
    const txt = ((await el.textContent()) || '').toLowerCase().trim();
    if (txt.match(/chat|command|ai agent|assistant|runtime/)) {
      try { await el.click({ timeout: 2000 }); chatClicked = txt; break; } catch {}
    }
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/03_chat_ui.png` });
  console.log(`✅ 03_chat_ui.png (clicked: "${chatClicked}")`);

  // ── 4: Type in chat ───────────────────────────────────────────────────────
  const inp = page.locator('input[type=text], input[placeholder], textarea').first();
  if (await inp.count() > 0) {
    await inp.fill('Show me hot contractor leads in Port St Lucie Florida');
    await page.screenshot({ path: `${OUT}/04_chat_typed.png` });
    console.log('✅ 04_chat_typed.png — query typed');
    await inp.press('Enter');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${OUT}/05_chat_response.png` });
    console.log('✅ 05_chat_response.png — LLM response');
  }

  // ── 5: Full page ──────────────────────────────────────────────────────────
  await page.goto(FRONTEND, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/06_full_page.png`, fullPage: true });
  console.log('✅ 06_full_page.png — full page scroll');

  await browser.close();
  console.log('\n🎉 Done!');
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
