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

const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey });

async function testVideoGen() {
  const imagePath = path.join(__dirname, '../public/characters/anand_front.png');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  console.log('Testing video generation with model veo-3.1-lite-generate-preview...');

  const modelsToTry = [
    'veo-3.1-lite-generate-preview',
    'veo-3.1-fast-generate-preview',
    'veo-3.1-generate-preview',
    'gemini-3.5-flash-lite',
  ];

  for (const model of modelsToTry) {
    console.log(`\n--- Trying model: ${model} ---`);
    try {
      const operation = await ai.models.generateVideos({
        model: model,
        source: {
          prompt: '3D cartoon character Anand comes to life, laughs with funny comedy expressions, energetic kuthu dance movement, fluid animation',
          image: {
            imageBytes: base64Image,
            mimeType: 'image/png'
          }
        },
        config: {
          aspectRatio: '9:16',
          numberOfVideos: 1,
          durationSeconds: 6,
          personGeneration: 'allow_adult'
        }
      });

      console.log('Operation returned:', operation);
      console.log('Operation done status:', operation.done);
      if (operation.name) {
        console.log('Polling operation:', operation.name);
        let op = operation;
        while (!op.done) {
          console.log('Waiting 5s...');
          await new Promise(r => setTimeout(r, 5000));
          op = await ai.operations.getVideosOperation({ operation: op });
          console.log('Op status:', op.done);
        }
        console.log('Final response:', JSON.stringify(op.response, null, 2));
        return op;
      }
    } catch (err) {
      console.error(`Error with ${model}:`, err.message);
    }
  }
}

testVideoGen();
