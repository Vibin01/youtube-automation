const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testLaunch() {
  const profileDir = path.join(__dirname, '../.gemini-browser-profile');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log('Testing launch with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  console.log('Browser launched successfully!');
  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  console.log('Navigating to gemini.google.com...');
  await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Current URL:', page.url());
  console.log('Current Title:', await page.title());

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  console.log('Closed browser successfully.');
}

testLaunch().catch(e => {
  console.error('Launch failed:', e.message);
  process.exit(1);
});
