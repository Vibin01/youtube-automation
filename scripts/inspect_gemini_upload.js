const puppeteer = require('puppeteer-core');

async function inspectGeminiControls() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('gemini.google.com'));

  if (!page) {
    console.log('Gemini page not found');
    browser.disconnect();
    return;
  }

  console.log('Found Gemini page. Inspecting upload button and mode picker...');

  const info = await page.evaluate(() => {
    // Find upload button
    const uploadBtn = document.querySelector('button[aria-label="Upload and tools"]') ||
                      document.querySelector('button[aria-label*="Upload"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('add') || b.getAttribute('aria-label')?.includes('Upload'));

    // Find input area
    const inputArea = document.querySelector('.ql-editor') || document.querySelector('[contenteditable="true"]');

    // Find mode picker
    const modePicker = document.querySelector('button[aria-label*="mode picker"]') ||
                       Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Gemini') || b.innerText.includes('Videos') || b.innerText.includes('Flash'));

    return {
      uploadBtn: uploadBtn ? { aria: uploadBtn.getAttribute('aria-label'), tag: uploadBtn.tagName } : null,
      inputArea: inputArea ? { tag: inputArea.tagName, placeholder: inputArea.getAttribute('data-placeholder') || inputArea.innerText } : null,
      modePicker: modePicker ? { aria: modePicker.getAttribute('aria-label'), text: modePicker.innerText } : null
    };
  });

  console.log('Gemini Controls:', JSON.stringify(info, null, 2));

  // If uploadBtn found, click it to see menu items
  if (info.uploadBtn) {
    await page.click('button[aria-label*="Upload"]');
    await new Promise(r => setTimeout(r, 1000));

    const menuItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"], mat-menu-item, .mat-mdc-menu-item, button')).map(el => ({
        text: el.innerText.trim(),
        aria: el.getAttribute('aria-label')
      })).filter(x => x.text && x.text.length < 50);
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
        accept: el.accept,
        id: el.id
      }));
      return { items: items.slice(0, 15), fileInputs };
    });

    console.log('After clicking upload button:');
    console.log(JSON.stringify(menuItems, null, 2));
  }

  browser.disconnect();
}

inspectGeminiControls();
