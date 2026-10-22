const puppeteer = require('puppeteer-core');
const path = require('path');

async function testUploadMenu() {
  const profileDir = path.join(__dirname, '../.gemini-browser-profile');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle2', timeout: 30000 });

  // Click the Upload & tools button
  const uploadBtn = await page.$('button[aria-label*="Upload"]');
  if (uploadBtn) {
    console.log('Clicking upload button...');
    await uploadBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    const menuInfo = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"], mat-menu-item, .mat-mdc-menu-item, button')).map(el => ({
        text: el.innerText.trim(),
        aria: el.getAttribute('aria-label')
      })).filter(x => x.text && x.text.length < 50);

      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
        id: el.id,
        accept: el.accept
      }));

      return { items, fileInputs };
    });

    console.log('Menu items & file inputs:');
    console.log(JSON.stringify(menuInfo, null, 2));
  } else {
    console.log('Upload button not found');
  }

  await browser.close();
}

testUploadMenu().catch(e => {
  console.error(e);
  process.exit(1);
});
