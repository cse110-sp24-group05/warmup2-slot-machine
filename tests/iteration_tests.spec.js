import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const PAGE_URL = pathToFileURL(
  resolve(__dirname, '..', 'src', 'iterations', 'iteration16', 'index.html')
).href;

async function waitForSpinComplete(page) {
  await expect(page.locator('#spin-btn')).toBeEnabled({ timeout: 8000 });
}

async function dismissBonusIfPresent(page) {
  const bonusModal = page.locator('#bonus-modal');
  if (await bonusModal.evaluate((el) => el.classList.contains('show')).catch(() => false)) {
    const wheelBtn = page.locator('#wheel-spin-btn');
    if (await wheelBtn.isVisible().catch(() => false)) {
      await wheelBtn.click();
    }
    const closeBtn = page.locator('#wheel-close-btn');
    await closeBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#spin-btn');
  await page.waitForSelector('#autoplay-btn');
});

test.describe('Iteration 16 - Autoplay System', () => {
  test('autoplay button opens the autoplay modal', async ({ page }) => {
    const modal = page.locator('#autoplay-modal');
    await expect(modal).not.toHaveClass(/show/);

    await page.locator('#autoplay-btn').click();

    await expect(modal).toHaveClass(/show/);
    await expect(page.locator('.autoplay-preset[data-count="5"]')).toBeVisible();
  });

  test('selecting a preset starts autoplay and updates the button', async ({ page }) => {
    await page.locator('#autoplay-btn').click();
    await page.locator('.autoplay-preset[data-count="5"]').click();

    const autoplayBtn = page.locator('#autoplay-btn');
    await expect(autoplayBtn).toHaveClass(/running/);
    await expect(autoplayBtn).toContainText('Stop');
    await expect(autoplayBtn).toContainText('left');
  });

  test('autoplay stops when the stop button is pressed', async ({ page }) => {
    await page.locator('#autoplay-btn').click();
    await page.locator('.autoplay-preset[data-count="25"]').click();

    const autoplayBtn = page.locator('#autoplay-btn');
    await expect(autoplayBtn).toHaveClass(/running/);

    await autoplayBtn.click();

    await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 5000 });
    await expect(autoplayBtn).toContainText('Autoplay');
  });

  test('autoplay stops when balance becomes insufficient', async ({ page }) => {
    await page.locator('.bet-preset[data-bet="max"]').click();
    await expect(page.locator('#bet')).toHaveValue('1000');

    await page.locator('#autoplay-btn').click();
    await page.locator('.autoplay-preset[data-count="50"]').click();

    const autoplayBtn = page.locator('#autoplay-btn');
    await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 30000 });

    const balance = await page.locator('#balance').textContent();
    const balanceNum = parseInt(balance.replace(/,/g, ''), 10);
    const spins = parseInt((await page.locator('#spins').textContent()).replace(/,/g, ''), 10);
    expect(spins).toBeGreaterThan(0);
    expect(spins).toBeLessThan(50);
    expect(balanceNum).toBeLessThan(1000);
  });

  test('autoplay does not allow multiple concurrent runs', async ({ page }) => {
    await page.locator('#autoplay-btn').click();
    await page.locator('.autoplay-preset[data-count="10"]').click();

    const autoplayBtn = page.locator('#autoplay-btn');
    await expect(autoplayBtn).toHaveClass(/running/);

    const modal = page.locator('#autoplay-modal');
    await expect(modal).not.toHaveClass(/show/);

    await autoplayBtn.click();
    await expect(modal).not.toHaveClass(/show/);
    await expect(autoplayBtn).not.toHaveClass(/running/);
  });
});

test.describe('Iteration 16 - Fast Spin / Speed Control', () => {
  test('default spin speed is 1x and Fast Spin button shows default label', async ({ page }) => {
    const fastBtn = page.locator('#fast-spin-btn');
    await expect(fastBtn).toHaveAttribute('data-speed', '1');
    await expect(fastBtn).not.toHaveClass(/active/);
    await expect(fastBtn.locator('.fast-spin-btn-label')).toHaveText('Fast Spin');
  });

  test('clicking Fast Spin button opens the speed-chooser modal', async ({ page }) => {
    const modal = page.locator('#fast-spin-modal');
    await expect(modal).not.toHaveClass(/show/);

    await page.locator('#fast-spin-btn').click();

    await expect(modal).toHaveClass(/show/);
    await expect(page.locator('.fast-spin-preset[data-speed="2"]')).toBeVisible();
    await expect(page.locator('.fast-spin-preset[data-speed="3"]')).toBeVisible();
  });

  test('selecting Fast 2x updates button state and closes modal', async ({ page }) => {
    await page.locator('#fast-spin-btn').click();
    await page.locator('.fast-spin-preset[data-speed="2"]').click();

    const fastBtn = page.locator('#fast-spin-btn');
    await expect(page.locator('#fast-spin-modal')).not.toHaveClass(/show/);
    await expect(fastBtn).toHaveAttribute('data-speed', '2');
    await expect(fastBtn).toHaveClass(/active/);
    await expect(fastBtn.locator('.fast-spin-btn-label')).toContainText('2');
  });

  test('Turbo 3x is reflected in the speed selector', async ({ page }) => {
    await page.locator('#fast-spin-btn').click();
    await page.locator('.fast-spin-preset[data-speed="3"]').click();

    const fastBtn = page.locator('#fast-spin-btn');
    await expect(fastBtn).toHaveAttribute('data-speed', '3');
    await expect(fastBtn.locator('.fast-spin-btn-label')).toContainText('3');
  });

  test('fast spin shortens spin duration vs default speed', async ({ page }) => {
    const startNormal = Date.now();
    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    const normalDuration = Date.now() - startNormal;

    await dismissBonusIfPresent(page);

    await page.locator('#fast-spin-btn').click();
    await page.locator('.fast-spin-preset[data-speed="3"]').click();

    const startTurbo = Date.now();
    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    const turboDuration = Date.now() - startTurbo;

    expect(turboDuration).toBeLessThan(normalDuration);
  });

  test('fast spin works with autoplay (turbo speed reflected during autoplay)', async ({ page }) => {
    await page.locator('#fast-spin-btn').click();
    await page.locator('.fast-spin-preset[data-speed="3"]').click();
    await expect(page.locator('#fast-spin-btn')).toHaveAttribute('data-speed', '3');

    await page.locator('#autoplay-btn').click();
    await page.locator('.autoplay-preset[data-count="5"]').click();

    const autoplayBtn = page.locator('#autoplay-btn');
    await expect(autoplayBtn).toHaveClass(/running/);
    await expect(page.locator('#fast-spin-btn')).toHaveAttribute('data-speed', '3');

    await autoplayBtn.click();
    await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 5000 });
  });
});

test.describe('Iteration 16 - History / Stats Tracking', () => {
  test('spins counter increments after each spin', async ({ page }) => {
    await expect(page.locator('#spins')).toHaveText('0');

    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    await expect(page.locator('#spins')).toHaveText('1');

    await dismissBonusIfPresent(page);
    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    await expect(page.locator('#spins')).toHaveText('2');
  });

  test('won and burned trackers update after several spins', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.locator('#spin-btn').click();
      await waitForSpinComplete(page);
      await dismissBonusIfPresent(page);
    }

    const won = parseInt((await page.locator('#won').textContent()).replace(/,/g, ''), 10);
    const burned = parseInt((await page.locator('#burned').textContent()).replace(/,/g, ''), 10);
    const spins = parseInt((await page.locator('#spins').textContent()).replace(/,/g, ''), 10);

    expect(spins).toBe(6);
    expect(won + burned).toBeGreaterThan(0);
  });

  test('stats modal opens and shows current totals', async ({ page }) => {
    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    await dismissBonusIfPresent(page);

    await page.locator('#stats-btn').click();
    const statsModal = page.locator('#stats-modal');
    await expect(statsModal).toHaveClass(/show/);
    await expect(page.locator('#stat-total-spins')).toHaveText('1');
    await expect(page.locator('#stat-avg-bet')).not.toHaveText('—');

    await page.locator('#close-stats-btn').click();
    await expect(statsModal).not.toHaveClass(/show/);
  });

  test('history modal lists past spins', async ({ page }) => {
    await page.locator('#history-btn').click();
    await expect(page.locator('#history-subtitle')).toContainText('No spins yet');
    await page.locator('#close-history-btn').click();

    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    await dismissBonusIfPresent(page);

    await page.locator('#history-btn').click();
    await expect(page.locator('#history-modal')).toHaveClass(/show/);
    await expect(page.locator('#history-list .history-row')).toHaveCount(1);
  });

  test('Refill button resets stats back to zero', async ({ page }) => {
    await page.locator('#spin-btn').click();
    await waitForSpinComplete(page);
    await dismissBonusIfPresent(page);
    await expect(page.locator('#spins')).toHaveText('1');

    await page.locator('#reset-btn').click();

    await expect(page.locator('#spins')).toHaveText('0');
    await expect(page.locator('#won')).toHaveText('0');
    await expect(page.locator('#burned')).toHaveText('0');
    await expect(page.locator('#balance')).toHaveText('1,000');
  });
});

test.describe('Iteration 16 - Settings Panel', () => {
  test('settings panel opens when the settings button is clicked', async ({ page }) => {
    const modal = page.locator('#settings-modal');
    await expect(modal).not.toHaveClass(/show/);

    await page.locator('#settings-btn').click();

    await expect(modal).toHaveClass(/show/);
    await expect(page.locator('#setting-sfx')).toBeVisible();
    await expect(page.locator('#setting-voice')).toBeVisible();
    await expect(page.locator('#setting-keyboard')).toBeVisible();
  });

  test('settings panel closes via the close button and overlay click', async ({ page }) => {
    await page.locator('#settings-btn').click();
    const modal = page.locator('#settings-modal');
    await expect(modal).toHaveClass(/show/);

    await page.locator('#close-settings-btn').click();
    await expect(modal).not.toHaveClass(/show/);

    await page.locator('#settings-btn').click();
    await expect(modal).toHaveClass(/show/);
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).not.toHaveClass(/show/);
  });

  test('sound effects toggle reflects user changes', async ({ page }) => {
    await page.locator('#settings-btn').click();

    const sfxToggle = page.locator('#setting-sfx');
    await expect(sfxToggle).toBeChecked();

    await sfxToggle.uncheck();
    await expect(sfxToggle).not.toBeChecked();

    await sfxToggle.check();
    await expect(sfxToggle).toBeChecked();
  });

  test('voiceover toggle stays in sync with the header voice button', async ({ page }) => {
    const headerVoice = page.locator('#speech-toggle');
    await expect(headerVoice).toHaveClass(/active/);

    await page.locator('#settings-btn').click();
    const voiceToggle = page.locator('#setting-voice');
    await expect(voiceToggle).toBeChecked();

    await voiceToggle.uncheck();
    await expect(voiceToggle).not.toBeChecked();
    await page.locator('#close-settings-btn').click();

    await expect(headerVoice).not.toHaveClass(/active/);
  });

  test('settings persist across closing and reopening the panel', async ({ page }) => {
    await page.locator('#settings-btn').click();

    await page.locator('#setting-sfx').uncheck();
    await page.locator('#setting-keyboard').check();
    await page.locator('#close-settings-btn').click();

    await expect(page.locator('#settings-modal')).not.toHaveClass(/show/);

    await page.locator('#settings-btn').click();
    await expect(page.locator('#setting-sfx')).not.toBeChecked();
    await expect(page.locator('#setting-keyboard')).toBeChecked();
    await expect(page.locator('#setting-voice')).toBeChecked();
  });
});
