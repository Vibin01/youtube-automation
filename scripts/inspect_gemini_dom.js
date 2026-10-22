const puppeteer = require('puppeteer-core');
const path = require('path');

async function inspectGeminiDOM() {
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

  console.log('Page loaded:', page.url());

  const info = await page.evaluate(() => {
    // Check if login is required
    const signInBtn = Array.from(document.querySelectorAll('a, button')).find(
      b => b.innerText.includes('Sign in') || b.innerText.includes('Log in')
    );

    // Look for file input
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(f => ({
      id: f.id,
      className: f.className,
      accept: f.accept
    }));

    // Look for upload buttons
    const uploadButtons = Array.from(document.querySelectorAll('button')).filter(b => {
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      const txt = b.innerText.toLowerCase();
      return aria.includes('upload') || aria.includes('add') || aria.includes('attach') || txt.includes('upload');
    }).map(b => ({
      aria: b.getAttribute('aria-label'),
      text: b.innerText.trim(),
      className: b.className
    }));

    // Look for input prompt textarea / editor
    const promptInputs = Array.from(document.querySelectorAll('.ql-editor, [contenteditable="true"], textarea, rich-textarea')).map(el => ({
      tag: el.tagName,
      className: el.className,
      placeholder: el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || el.getAttribute('aria-label')
    }));

    // Look for send button
    const sendButtons = Array.from(document.querySelectorAll('button')).filter(b => {
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      return aria.includes('send') || aria.includes('submit');
    }).map(b => ({
      aria: b.getAttribute('aria-label'),
      text: b.innerText.trim()
    }));

    return {
      isSignedIn: !signInBtn,
      signInText: signInBtn ? signInBtn.innerText : null,
      fileInputs,
      uploadButtons,
      promptInputs,
      sendButtons
    };
  });

  console.log('Gemini DOM Analysis:');
  console.log(JSON.stringify(info, null, 2));

  // Keep open 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
}

inspectGeminiDOM().catch(e => {
  console.error(e);
  process.exit(1);
});
