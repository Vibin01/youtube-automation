const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
let apiKey = '';
for (const line of env.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY')) {
    apiKey = line.split('=')[1].trim().replace(/['"]/g, '');
    break;
  }
}
console.log('API Key length:', apiKey.length);
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const list = await ai.models.list();
    const all = [];
    for await (const m of list) {
      all.push(m.name);
    }
    console.log('Total models:', all.length);
    console.log('Models with flash/veo/video:');
    console.log(all.filter(name => name.includes('veo') || name.includes('video') || name.includes('flash') || name.includes('imagen')));
  } catch (err) {
    console.error('List error:', err.message);
  }
}
run();
