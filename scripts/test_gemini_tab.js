const puppeteer = require('puppeteer-core');

async function testConnect() {
  try {
    console.log('Connecting to existing Chrome on http://127.0.0.1:9222...');
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null,
    });

    const pages = await browser.pages();
    console.log('Found', pages.length, 'pages:');
    let geminiPage = null;

    for (const page of pages) {
      const url = page.url();
      const title = await page.title();
      console.log(`- "${title}" -> ${url}`);
      if (url.includes('gemini.google.com')) {
        geminiPage = page;
      }
    }

    if (geminiPage) {
      console.log('\n🎯 Successfully located Google Gemini tab!');
      // Inspect elements on Gemini page
      const pageInfo = await geminiPage.evaluate(() => {
        const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
          name: el.name,
          id: el.id,
          accept: el.accept
        }));
        const textareas = Array.from(document.querySelectorAll('textarea, rich-textarea, [contenteditable="true"]')).map(el => ({
          tagName: el.tagName,
          placeholder: el.getAttribute('placeholder') || el.getAttribute('aria-label'),
          className: el.className
        }));
        const buttons = Array.from(document.querySelectorAll('button')).map(el => ({
          text: el.innerText.trim(),
          ariaLabel: el.getAttribute('aria-label')
        })).filter(b => b.text || b.ariaLabel);

        return { fileInputs, textareas, buttonsCount: buttons.length, buttonsSample: buttons.slice(0, 15) };
      });

      console.log('\nGemini Page DOM Info:');
      console.log(JSON.stringify(pageInfo, null, 2));
    } else {
      console.log('Gemini tab not found among open pages.');
    }

    browser.disconnect();
  } catch (err) {
    console.error('Error connecting to Chrome:', err.message);
  }
}

testConnect();
