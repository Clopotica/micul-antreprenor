'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  const passwords = JSON.parse(process.env.LOGIN_TEST_PASSWORDS || 'null');
  assert(Array.isArray(passwords) && passwords.length === 20, 'Set LOGIN_TEST_PASSWORDS to the 20 supplied passwords as a JSON array.');
  const root = path.resolve(__dirname, '..');
  const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });
  const server = http.createServer((req, res) => {
    const file = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
    // Only serve application files from the repository root.
    if (!['index.html', 'styles.css', 'i18n.js', 'game.js', 'auth.js'].includes(file)) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(path.join(root, file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const context = await browser.newContext();
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
  const page = await context.newPage();
  const errors = [];
  context.on('page', p => p.on('pageerror', error => errors.push(error.message)));
  page.on('pageerror', error => errors.push(error.message));
  async function login(p, user, password) {
    await p.locator('#loginUsername').fill(user);
    await p.locator('#loginPassword').fill(password);
    await p.locator('#loginSubmit').click();
    try { await p.locator('#gameApp').waitFor({ state: 'visible', timeout: 10000 }); } catch (error) { console.error('Login failed for', user, await p.locator('#loginError').textContent(), errors); throw error; }
  }
  async function logout(p) {
    await p.locator('#logoutButton').click();
    await p.locator('#loginScreen').waitFor({ state: 'visible' });
    await p.waitForFunction(() => !document.getElementById('loginUsername').disabled);
    assert.equal(await p.evaluate(() => sessionStorage.getItem('littleFounder.user.v1')), null);
  }
  try {
    await page.goto(url);
    assert.equal(await page.locator('#gameApp').isVisible(), false);
    assert.equal(await page.evaluate(() => typeof BOB), 'undefined');
    await page.locator('#loginUsername').fill('user01');
    await page.locator('#loginPassword').fill(passwords[0].toLowerCase());
    await page.locator('#showPassword').check();
    assert.equal(await page.locator('#loginPassword').getAttribute('type'), 'text');
    await page.locator('#showPassword').uncheck();
    await page.locator('#loginSubmit').click();
    await page.locator('#loginError').waitFor({ state:'visible' });
    const wrongError = await page.locator('#loginError').textContent();
    assert.equal(await page.locator('#gameApp').isVisible(), false);
    await page.locator('#loginUsername').fill('toString');
    await page.locator('#loginPassword').fill(passwords[0]);
    await page.locator('#loginSubmit').click();
    await page.waitForFunction(() => !document.getElementById('loginSubmit').disabled);
    assert.equal(await page.locator('#loginError').textContent(), wrongError);
    assert.equal(await page.locator('#gameApp').isVisible(), false);
    await page.locator('[data-login-lang="en"]').click();
    assert.equal(await page.locator('#loginSubmit').textContent(), 'Enter the game →');
    await page.locator('[data-login-lang="ro"]').click();
    for (let i = 0; i < passwords.length; i++) {
      const user = 'user' + String(i + 1).padStart(2, '0');
      await login(page, i === 0 ? ' USER01 ' : user, passwords[i]);
      assert.equal(await page.locator('#accountUsername').textContent(), user);
      assert.equal(await page.locator('#loginPassword').inputValue(), '');
      await logout(page);
    }
    console.log('PASS: all 20 accounts, wrong credentials, username normalization, password case, languages, logout.');

    await page.evaluate(() => localStorage.setItem('bossOfTheBlock.save.v2','legacy-save'));
    await login(page, 'user01', passwords[0]);
    await page.locator('#standName').fill('Stand user01');
    await page.locator('#btnStart').click();
    await page.locator('#introGo').click();
    const save1 = await page.evaluate(() => localStorage.getItem('bossOfTheBlock.save.v2.user01'));
    assert.equal(JSON.parse(save1).name, 'Stand user01');
    await page.evaluate(() => localStorage.setItem('bossOfTheBlock.progress.v1.user01', JSON.stringify({street:{won:true,plays:1}})));
    await page.reload();
    await page.locator('#gameApp').waitFor({state:'visible'});
    assert.equal(await page.locator('#accountUsername').textContent(), 'user01');
    assert.equal(await page.locator('#screen-start .btn-go').count(), 1);
    await page.locator('#screen-start .btn-go').click();
    assert.equal(await page.locator('#tbStandName').textContent(), 'Stand user01');
    await logout(page);
    await login(page, 'user02', passwords[1]);
    assert.equal(await page.locator('#screen-start .btn-go').count(), 0);
    assert.match(await page.locator('#modeCount').textContent(), /0/);
    await page.locator('#standName').fill('Stand user02');
    await page.locator('#btnStart').click();
    await page.locator('#introGo').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('bossOfTheBlock.save.v2.user01')), save1);
    assert.equal(await page.evaluate(() => localStorage.getItem('bossOfTheBlock.save.v2')), 'legacy-save');
    await page.locator('#btnMenu').click();
    await page.locator('#menuModal [data-lang="en"]').click();
    assert.equal(await page.locator('#logoutButton').textContent(), 'Sign out');
    await page.locator('#menuClose').click();
    const secondTab = await context.newPage();
    await secondTab.goto(url);
    assert.equal(await secondTab.locator('#gameApp').isVisible(), false);
    await login(secondTab, 'user01', passwords[0]);
    assert.equal(await page.locator('#accountUsername').textContent(), 'user02');
    assert.equal(await secondTab.locator('#screen-start .btn-go').count(), 1);
    await secondTab.close();
    await logout(page);
    await page.evaluate(() => sessionStorage.setItem('littleFounder.user.v1','unknown'));
    await page.reload();
    assert.equal(await page.locator('#gameApp').isVisible(), false);
    console.log('PASS: refresh/resume, isolated user saves, legacy saves preserved, independent tabs, invalid session.');

    await page.setViewportSize({width:375,height:812});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    if (process.env.LOGIN_SCREENSHOT) await page.screenshot({path:process.env.LOGIN_SCREENSHOT,fullPage:true});
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await login(page,'user20',passwords[19]);
    await logout(page);
    console.log('PASS: mobile layout and offline file login.');

    const blocked = await context.newPage();
    await blocked.addInitScript(() => {
      Object.defineProperty(window,'sessionStorage',{get(){throw new Error('blocked');}});
      Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});
    });
    await blocked.goto(url);
    await login(blocked,'user01',passwords[0]);
    await blocked.locator('#logoutButton').click();
    await blocked.locator('#loginScreen').waitFor({state:'visible'});
    await blocked.close();
    const failure = await context.newPage();
    await failure.goto(url);
    await failure.route('**/game.js*', route => route.abort());
    await failure.locator('#loginUsername').fill('user01');
    await failure.locator('#loginPassword').fill(passwords[0]);
    await failure.locator('#loginSubmit').click();
    await failure.locator('#loginError').waitFor({state:'visible'});
    assert.equal(await failure.locator('#gameApp').isVisible(), false);
    assert.equal(await failure.evaluate(() => sessionStorage.getItem('littleFounder.user.v1')), null);
    await failure.close();
    const noCrypto = await context.newPage();
    await noCrypto.addInitScript(() => Object.defineProperty(window, 'crypto', {value:{}}));
    await noCrypto.goto(url);
    await noCrypto.locator('#loginUsername').fill('user01');
    await noCrypto.locator('#loginPassword').fill(passwords[0]);
    await noCrypto.locator('#loginSubmit').click();
    await noCrypto.locator('#loginError').waitFor({state:'visible'});
    assert.equal(await noCrypto.locator('#gameApp').isVisible(),false);
    await noCrypto.close();
    assert.deepEqual(errors, []);
    console.log('PASS: blocked storage, missing game script, unavailable crypto; no browser runtime errors.');
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
