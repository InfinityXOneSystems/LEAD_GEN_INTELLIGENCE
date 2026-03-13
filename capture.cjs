'use strict';
const { chromium } = require('playwright');
const { mkdirSync } = require('fs');
const OUT = '/tmp/screenshots';
mkdirSync(OUT, { recursive: true });

const BASE = 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 1. Dashboard home (Chat Agent active) ────────────────────────────────
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/01_chat_agent_home.png` });
  console.log('✅ 01_chat_agent_home.png — Chat Agent home page');

  // ── 2. Click Leads tab ────────────────────────────────────────────────────
  await page.locator('text=📋 Leads').click();
  await page.waitForTimeout(3500); // wait for data to load
  await page.screenshot({ path: `${OUT}/02_leads_all.png` });
  const bodyTxt = (await page.locator('body').innerText()).slice(0,300);
  console.log('✅ 02_leads_all.png — All leads table');
  console.log('   preview:', bodyTxt.replace(/\n/g,'|'));

  // ── 3. Filter for Port St Lucie ───────────────────────────────────────────
  const searchBox = page.locator('input[placeholder*="Filter"]');
  await searchBox.fill('Port St Lucie');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/03_port_st_lucie_leads.png` });
  console.log('✅ 03_port_st_lucie_leads.png — Port St Lucie filtered leads');

  // ── 4. Filter for hot leads ───────────────────────────────────────────────
  await searchBox.fill('hot');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/04_hot_leads.png` });
  console.log('✅ 04_hot_leads.png — HOT tier leads');

  // ── 5. Clear filter, show FL leads ────────────────────────────────────────
  await searchBox.fill('FL');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/05_florida_leads.png` });
  console.log('✅ 05_florida_leads.png — Florida leads');

  // ── 6. Chat Agent — type PSL query ────────────────────────────────────────
  await page.locator('text=💬 Chat Agent').click();
  await page.waitForTimeout(1500);
  const chatIn = page.locator('input[type=text], input[placeholder], textarea').first();
  await chatIn.fill('scrape epoxy flooring contractors in Port St Lucie Florida');
  await page.screenshot({ path: `${OUT}/06_chat_psl_query.png` });
  console.log('✅ 06_chat_psl_query.png — Chat query typed');
  await chatIn.press('Enter');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/07_chat_response.png` });
  console.log('✅ 07_chat_response.png — Chat agent response');

  // ── 7. Agent Activity ────────────────────────────────────────────────────
  await page.locator('text=🤖 Agent Activity').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/08_agent_activity.png` });
  console.log('✅ 08_agent_activity.png — Agent Activity feed');

  // ── 8. Full page scroll of leads ─────────────────────────────────────────
  await page.locator('text=📋 Leads').click();
  await page.waitForTimeout(2000);
  await page.locator('input[placeholder*="Filter"]').fill('');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/09_leads_full.png`, fullPage: true });
  console.log('✅ 09_leads_full.png — Full page leads');

  await browser.close();
  console.log('\n🎉 All screenshots saved!');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
