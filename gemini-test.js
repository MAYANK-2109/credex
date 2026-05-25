#!/usr/bin/env node

/**
 * Gemini API Test Script
 * Equivalent to the Python example provided by the user
 * 
 * Usage:
 *   node gemini-test.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Read API key from .env.local environment variables
const API_KEY = process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY_SECONDARY;
const MODEL = 'gemini-2.0-flash';

if (!API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY_PRIMARY or GEMINI_API_KEY_SECONDARY not found in .env.local');
  console.error('Get a free key at: https://ai.google.dev/');
  process.exit(1);
}

console.log('🚀 Gemini API Test');
console.log(`Model: ${MODEL}`);
console.log(`API Key: ${API_KEY.slice(0, 10)}...`);
console.log('Type "exit" to quit\n');

/**
 * Make request to Gemini API
 * Equivalent to Python: model.generate_content(prompt)
 */
function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 1.0,
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.error) {
            reject(new Error(`API Error: ${result.error.message}`));
            return;
          }

          const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!generatedText) {
            reject(new Error('No text in API response'));
            return;
          }

          resolve(generatedText);
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.write(postData);
    request.end();
  });
}

/**
 * Main loop - equivalent to Python while(choice) loop
 */
async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const ans = input.trim();

      if (ans === 'exit') {
        console.log('Exiting...');
        rl.close();
        process.exit(0);
      }

      if (!ans) {
        askQuestion();
        return;
      }

      try {
        console.log('\n⏳ Generating response...');
        const response = await callGeminiAPI(ans);
        console.log(`\nGemini: ${response}\n`);
      } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
