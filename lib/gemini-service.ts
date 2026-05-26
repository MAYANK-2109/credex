/**
 * Gemini API Service - Equivalent to Python genai library
 * 
 * Usage:
 *   const response = await callGeminiAPI("Your prompt here");
 *   console.log(response.text);
 */

interface GeminiResponse {
  text: string;
  source: 'primary' | 'secondary' | 'fallback';
  error?: string;
}

/**
 * Call Google Gemini API with automatic retry logic
 * Similar to Python: model.generate_content(prompt)
 */
export async function callGeminiAPI(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  }
): Promise<GeminiResponse> {
  const {
    model = 'gemini-2.5-flash',
    maxTokens = 300,
    temperature = 1.0,
    timeout = 10000,
  } = options || {};

  // Try Primary API Key
  const primaryKey = process.env.GEMINI_API_KEY_PRIMARY;
  if (primaryKey) {
    try {
      console.log(`[Gemini API] Trying PRIMARY with model: ${model}`);
      const result = await makeGeminiRequest(prompt, primaryKey, model, maxTokens, temperature, timeout);
      console.log('[Gemini API] ✅ Primary API call succeeded');
      return { ...result, source: 'primary' };
    } catch (err: any) {
      console.error('[Gemini API] ❌ Primary failed:', err.message);
    }
  } else {
    console.warn('[Gemini API] GEMINI_API_KEY_PRIMARY not set');
  }

  // Try Secondary API Key
  const secondaryKey = process.env.GEMINI_API_KEY_SECONDARY;
  if (secondaryKey) {
    try {
      console.log(`[Gemini API] Trying SECONDARY with model: ${model}`);
      const result = await makeGeminiRequest(prompt, secondaryKey, model, maxTokens, temperature, timeout);
      console.log('[Gemini API] ✅ Secondary API call succeeded');
      return { ...result, source: 'secondary' };
    } catch (err: any) {
      console.error('[Gemini API] ❌ Secondary failed:', err.message);
    }
  } else {
    console.warn('[Gemini API] GEMINI_API_KEY_SECONDARY not set');
  }

  // Fallback to templated response
  console.log('[Gemini API] ⚠️ All API keys exhausted or failed, returning fallback');
  return {
    text: 'Unable to generate AI summary at this time. Please try again later or contact support.',
    source: 'fallback',
    error: 'All API attempts failed',
  };
}

/**
 * Make actual HTTP request to Google Gemini API
 * Equivalent to Python: genai.configure() + model.generate_content()
 */
async function makeGeminiRequest(
  prompt: string,
  apiKey: string,
  model: string,
  maxTokens: number,
  temperature: number,
  timeout: number
): Promise<{ text: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[Gemini API] POST ${endpoint.replace(apiKey, '***')}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Check for API errors
    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API error: ${errorMsg}`);
    }

    // Extract generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No text in Gemini API response');
    }

    console.log(`[Gemini API] Response received: ${generatedText.length} characters`);
    return { text: generatedText.trim() };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Gemini API timeout after ${timeout}ms`);
    }
    throw err;
  }
}

/**
 * Test the Gemini API connection
 * Usage: await testGeminiConnection();
 */
export async function testGeminiConnection(): Promise<void> {
  console.log('[Gemini API Test] Starting connection test...\n');

  const testPrompt = 'Say "Hello from Gemini!" in exactly those words.';

  try {
    const response = await callGeminiAPI(testPrompt, {
      model: 'gemini-2.5-flash',
      maxTokens: 100,
      timeout: 10000,
    });

    console.log('\n[Gemini API Test] ✅ Connection successful!');
    console.log(`Source: ${response.source}`);
    console.log(`Response: ${response.text}\n`);
  } catch (err: any) {
    console.error('[Gemini API Test] ❌ Connection failed:', err.message);
    process.exit(1);
  }
}
