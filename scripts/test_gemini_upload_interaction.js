const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testUploadInteraction() {
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

  console.log('Gemini page loaded. Checking upload capabilities...');

  // Check file inputs
  let fileInputs = await page.$$('input[type="file"]');
  console.log('Initial file inputs found:', fileInputs.length);

  // If no file input visible, click upload button
  if (fileInputs.length === 0) {
    const uploadBtn = await page.$('button[aria-label*="Upload"]');
    if (uploadBtn) {
      console.log('Clicking upload button to expose file input...');
      await uploadBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      fileInputs = await page.$$('input[type="file"]');
      console.log('File inputs after clicking upload:', fileInputs.length);
    }
  }

  const sampleImage = path.join(__dirname, '../public/characters/anand_front.png');
  if (fs.existsSync(sampleImage) && fileInputs.length > 0) {
    console.log(`Found image: ${sampleImage}. Attempting upload to image input...`);
    // Find the input with accept="image/*"
    let imageInput = null;
    for (const input of fileInputs) {
      const accept = await page.evaluate(el => el.getAttribute('accept'), input);
      if (accept && accept.includes('image')) {
        imageInput = input;
        break;
      }
    }

    if (!imageInput) imageInput = fileInputs[0];

    try {
      await imageInput.uploadFile(sampleImage);
      console.log('uploadFile called successfully!');
      await new Promise(r => setTimeout(r, 2000));

      // Check if image preview or chip appeared
      const hasPreview = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src && (img.src.startsWith('blob:') || img.src.includes('googleusercontent')));
        return imgs.map(i => ({ src: i.src.slice(0, 50), alt: i.alt }));
      });
      console.log('Preview images detected:', hasPreview);
    } catch (err) {
      console.error('uploadFile error:', err.message);
    }
  } else {
    console.log('Image or file input not found');
  }

  console.log('Closing browser in 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

testUploadInteraction().catch(console.error);
