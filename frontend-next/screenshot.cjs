const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:2000/xem-phim/vo-gian-dao-truong?ver=1&ep=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/Moha/AppData/Local/Temp/shot_desktop.png' });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:2000/xem-phim/vo-gian-dao-truong?ver=1&ep=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/Moha/AppData/Local/Temp/shot_mobile.png' });

  await browser.close();
  console.log('done');
})();

