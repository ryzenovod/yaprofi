#!/usr/bin/env node

const assert = require('node:assert/strict');

function loadPlaywright() {
  try {
    return require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  } catch (error) {
    console.error(
      'Unable to load Playwright. Install the playwright package locally or set PLAYWRIGHT_MODULE to an absolute module path.',
    );
    throw error;
  }
}

const { chromium } = loadPlaywright();

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:8765';
const KEY = 'yaprofi-market-host-v2';

const initialTeam = (index) => ({
  name: `Команда ${index + 1}`,
  cash: 150,
  energy: 5,
  agro: 5,
  tech: 5,
  bonus: false,
});

const fullOldV2State = () => ({
  round: 4,
  phase: 'Событие',
  prices: { energy: -3, agro: 12, tech: 25 },
  previous: { energy: 8, agro: 12, tech: 21 },
  timer: { duration: 60, remaining: 42, running: false, endAt: null },
  sound: false,
  history: [
    {
      at: '2026-10-01T10:00:00.000Z',
      prices: { energy: -3, agro: 12, tech: 25 },
      reason: 'Импорт старой сессии',
    },
  ],
  eventDeck: [0, 1, 2, 3],
  currentEvent: 1,
  eventApplied: true,
  teams: Array.from({ length: 6 }, (_, index) => ({
    ...initialTeam(index),
    name: index === 0 ? 'Север' : `Команда ${index + 1}`,
    cash: index === 0 ? 90 : 150,
    energy: index === 0 ? 7 : 5,
    agro: index === 0 ? 2 : 5,
    tech: index === 0 ? 3 : 5,
    bonus: index === 0,
  })),
});

const freshStoredState = (overrides = {}) => ({
  round: 1,
  phase: 'Торги',
  prices: { energy: 10, agro: 10, tech: 10 },
  previous: { energy: 10, agro: 10, tech: 10 },
  timer: { duration: 360, remaining: 360, running: false, endAt: null },
  sound: false,
  history: [],
  eventDeck: [],
  currentEvent: null,
  eventApplied: false,
  teams: Array.from({ length: 6 }, (_, index) => initialTeam(index)),
  ...overrides,
});

async function setSession(page, state) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: KEY, value: state },
  );
}

async function getSession(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}

async function openPage(context, path = '/') {
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(new URL(path, SITE_URL).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body');
  return { page, pageErrors };
}

async function importJson(page, name, value, options = {}) {
  await page.getByRole('button', { name: 'Сессия' }).click();
  await waitForToastIdle(page);
  const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
  await page.locator('#importInput').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)),
  });
  if (options.expect === 'failure') {
    await page.waitForFunction(
      ({ key, valueBefore }) =>
        localStorage.getItem(key) === valueBefore &&
        document.getElementById('toast')?.classList.contains('show'),
      { key: KEY, valueBefore: before },
    );
    return;
  }
  await page.waitForFunction(
    ({ key, valueBefore }) => localStorage.getItem(key) !== valueBefore,
    { key: KEY, valueBefore: before },
  );
}

async function withContext(browser, name, fn, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
  });
  try {
    await fn(context);
    console.log(`ok - ${name}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  const tests = [
    [
      'official logo renders and old Я-ПРОФИ branding is absent',
      async (context) => {
        const { page, pageErrors } = await openPage(context);

        const title = await page.title();
        const visibleText = await page.locator('body').innerText();
        assert.equal(title.includes('Я-ПРОФИ'), false);
        assert.equal(visibleText.includes('Я-ПРОФИ'), false);

        const logo = page.locator('img.brand-logo').first();
        await expectLogoRendered(logo);

        const icon = await page.evaluate(async () => {
          const href = document.querySelector('link[rel="icon"]')?.href;
          if (!href) return { ok: false, hasSvg: false, parserErrors: 1 };
          const response = await fetch(href);
          const text = response.ok ? await response.text() : '';
          const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
          return {
            ok: response.ok,
            hasSvg: parsed.documentElement?.localName === 'svg',
            parserErrors: parsed.getElementsByTagName('parsererror').length,
          };
        });
        assert.equal(icon.ok, true);
        assert.equal(icon.hasSvg, true);
        assert.equal(icon.parserErrors, 0);
        assert.deepEqual(pageErrors, []);
      },
      { viewport: { width: 390, height: 900 } },
    ],
    [
      'negative prices affect team totals and repeated undo returns to 10',
      async (context) => {
        const { page, pageErrors } = await openPage(context);

        await page.locator('#batchEnergy').fill('-15');
        await page.locator('#batchAgro').fill('-3');
        await page.locator('#batchTech').fill('2');
        await page.locator('#applyBatchBtn').click();
        await assertMarket(page, { energy: -5, agro: 7, tech: 12 });

        await page.getByRole('button', { name: 'Команды' }).click();
        const firstTotal = Number(await page.locator('#teamsBody tr').first().locator('td').last().innerText());
        assert.equal(firstTotal, 150 + 5 * -5 + 5 * 7 + 5 * 12);

        await page.getByRole('button', { name: 'Сценарий' }).click();
        await page.locator('.asset[data-asset="energy"] button[data-change="3"]').click();
        await page.locator('.asset[data-asset="agro"] button[data-change="-1"]').click();
        await assertMarket(page, { energy: -2, agro: 6, tech: 12 });

        await page.locator('#undoBtn').click();
        await page.locator('#undoBtn').click();
        await page.locator('#undoBtn').click();
        await assertMarket(page, { energy: 10, agro: 10, tech: 10 });
        assert.deepEqual(pageErrors, []);
      },
    ],
    [
      'team name and number inputs keep focus while timer ticks',
      async (context) => {
        const { page, pageErrors } = await openPage(context);
        await setSession(
          page,
          freshStoredState({
            timer: {
              duration: 360,
              remaining: 3,
              running: true,
              endAt: Date.now() + 3000,
            },
          }),
        );
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Команды' }).click();

        const nameInput = page.locator('#teamsBody tr').first().locator('[data-field="name"]');
        await nameInput.click();
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
        for (const char of 'Команда А') {
          await page.keyboard.type(char);
          assert.equal(await activeTeamField(page), 'name');
        }
        await page.waitForTimeout(350);
        assert.equal(await activeTeamField(page), 'name');
        assert.equal(await nameInput.inputValue(), 'Команда А');

        const cashInput = page.locator('#teamsBody tr').first().locator('[data-field="cash"]');
        await cashInput.click();
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
        for (const char of '123') {
          await page.keyboard.type(char);
          assert.equal(await activeTeamField(page), 'cash');
        }
        await page.waitForTimeout(350);
        assert.equal(await activeTeamField(page), 'cash');
        assert.equal(await cashInput.inputValue(), '123');
        assert.deepEqual(pageErrors, []);
      },
    ],
    [
      'valid old v2 import restores state and invalid imports leave session intact',
      async (context) => {
        const { page, pageErrors } = await openPage(context);
        const validState = fullOldV2State();

        await importJson(page, 'old-v2.json', validState);
        await expectStoredSubset(page, {
          round: 4,
          phase: 'Событие',
          prices: { energy: -3, agro: 12, tech: 25 },
          currentEvent: 1,
          eventApplied: true,
        });
        await page.getByRole('button', { name: 'Команды' }).click();
        assert.equal(await page.locator('#teamsBody tr').count(), 6);
        assert.equal(await page.locator('#teamsBody tr').first().locator('[data-field="name"]').inputValue(), 'Север');

        const beforeMalformed = await page.evaluate((key) => localStorage.getItem(key), KEY);
        await importJson(page, 'broken.json', '{"round":', { expect: 'failure' });
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), beforeMalformed);

        await importJson(page, 'incomplete.json', { prices: { energy: 3 } }, { expect: 'failure' });
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), beforeMalformed);

        const hostileFull = fullOldV2State();
        hostileFull.teams[0].name = '<img src=x onerror=alert(1)>';
        hostileFull.history[0].reason = '<img src=x onerror=alert(1)>';
        await importJson(page, 'hostile-full.json', hostileFull);
        await page.getByRole('button', { name: 'Команды' }).click();
        assert.equal(
          await page.locator('#teamsBody tr').first().locator('[data-field="name"]').inputValue(),
          '<img src=x onerror=alert(1)>',
        );
        await page.getByRole('button', { name: 'Новости рынка' }).click();
        assert.equal(await page.locator('#historyList .history-reason').first().innerText(), hostileFull.history[0].reason);
        assert.equal(await page.locator('img[src="x"]').count(), 0);
        assert.deepEqual(pageErrors, []);
      },
    ],
    [
      'event applies once and undo permits reapplying the same event',
      async (context) => {
        const { page, pageErrors } = await openPage(context);
        await setSession(page, freshStoredState({ phase: 'Событие', currentEvent: 1, eventApplied: false }));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Новости рынка' }).click();

        await page.locator('#applyEventBtn').click();
        await assertMarket(page, { energy: 10, agro: 10, tech: 14 });
        await assertButtonDisabled(page.locator('#applyEventBtn'), true);

        await page.locator('#undoBtn').click();
        await assertMarket(page, { energy: 10, agro: 10, tech: 10 });
        await assertButtonDisabled(page.locator('#applyEventBtn'), false);

        await page.locator('#applyEventBtn').click();
        await assertMarket(page, { energy: 10, agro: 10, tech: 14 });
        assert.deepEqual(pageErrors, []);
      },
    ],
    [
      'projector is read-only and has no controller at mobile and display widths',
      async (context) => {
        const expiredRunning = freshStoredState({
          phase: 'Торги',
          timer: {
            duration: 1,
            remaining: 1,
            running: true,
            endAt: Date.now() - 5000,
          },
        });
        await context.addInitScript(
          ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
          { key: KEY, value: expiredRunning },
        );
        const { page, pageErrors } = await openPage(context, '/?display=1');
        await page.waitForTimeout(400);

        assert.equal(await page.locator('#displayView').isVisible(), true);
        assert.equal(await page.locator('#controllerView').isVisible(), false);
        assert.equal(await page.locator('#projectorBtn').isVisible(), false);
        assert.equal(await page.locator('#displayTimer').innerText(), '00:00');

        const stored = await getSession(page);
        assert.equal(stored.timer.running, true);
        assert.equal(stored.timer.endAt, expiredRunning.timer.endAt);

        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal(await page.locator('#displayView').isVisible(), true);
        assert.equal(await page.locator('#controllerView').isVisible(), false);
        const screenshot = await page.screenshot();
        assert.ok(screenshot.length > 1000);
        assert.deepEqual(pageErrors, []);
      },
      { viewport: { width: 1440, height: 900 } },
    ],
    [
      'round 6 next controls do not restart a trading timer',
      async (context) => {
        const { page, pageErrors } = await openPage(context);
        const roundSix = freshStoredState({
          round: 6,
          phase: 'Торги',
          timer: { duration: 60, remaining: 17, running: false, endAt: null },
        });

        await setSession(page, roundSix);
        await page.reload({ waitUntil: 'domcontentloaded' });
        const nextRound = page.locator('#nextRoundBtn');
        if (await nextRound.isDisabled()) {
          assert.equal(await nextRound.isDisabled(), true);
        } else {
          await nextRound.click();
        }
        await expectRoundSixNoop(page, roundSix);

        await setSession(page, roundSix);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('body').click();
        await page.keyboard.press('N');
        await expectRoundSixNoop(page, roundSix);
        assert.deepEqual(pageErrors, []);
      },
    ],
  ];

  try {
    for (const [name, fn, options] of tests) {
      await withContext(browser, name, fn, options);
    }
  } finally {
    await browser.close();
  }
}

async function expectLogoRendered(locator) {
  await locator.waitFor({ state: 'visible' });
  const rendered = await locator.evaluate((img) => ({
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    width: img.getBoundingClientRect().width,
    height: img.getBoundingClientRect().height,
  }));
  assert.equal(rendered.complete, true);
  assert.ok(rendered.naturalWidth > 0);
  assert.ok(rendered.naturalHeight > 0);
  assert.ok(rendered.width > 0);
  assert.ok(rendered.height > 0);
}

async function assertMarket(page, expected) {
  for (const [asset, value] of Object.entries(expected)) {
    await assert
      .doesNotReject(async () => {
        await page.waitForFunction(
          ({ id, text }) => document.getElementById(id)?.textContent.trim() === text,
          { id: `${asset}Price`, text: String(value) },
        );
      })
      .catch(() => assert.fail(`${asset} price did not become ${value}`));
  }
}

async function activeTeamField(page) {
  return page.evaluate(() => document.activeElement?.dataset?.field || null);
}

async function waitForToastIdle(page) {
  await page
    .waitForFunction(() => !document.getElementById('toast')?.classList.contains('show'), null, {
      timeout: 2500,
    })
    .catch(() => {});
}

async function assertButtonDisabled(locator, expected) {
  await locator.waitFor();
  assert.equal(await locator.evaluate((button) => button.disabled), expected);
}

async function expectStoredSubset(page, expected) {
  const stored = await getSession(page);
  for (const [field, value] of Object.entries(expected)) {
    assert.deepEqual(stored[field], value);
  }
}

async function expectRoundSixNoop(page, expected) {
  await page.waitForFunction(() => document.getElementById('roundLabel')?.textContent.includes('РАУНД 6 / 6'));
  const stored = await getSession(page);
  assert.equal(stored.round, 6);
  assert.equal(stored.phase, expected.phase);
  assert.deepEqual(stored.timer, expected.timer);
  assert.notEqual(await page.locator('#timerText').innerText(), '06:00');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
