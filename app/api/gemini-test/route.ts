import { NextResponse } from 'next/server';
import { callGeminiAPI } from '@/lib/gemini-service';

/**
 * GET /api/gemini-test
 * Test endpoint to verify Gemini API connection
 * 
 * Usage:
 *   curl http://localhost:3000/api/gemini-test
 */
export async function GET() {
  console.log('\n=== Gemini API Connection Test ===\n');

  // Check environment variables
  const hasPrimary = !!process.env.GEMINI_API_KEY_PRIMARY;
  const hasSecondary = !!process.env.GEMINI_API_KEY_SECONDARY;

  console.log(`Primary API Key: ${hasPrimary ? '✅ Set' : '❌ Missing'}`);
  console.log(`Secondary API Key: ${hasSecondary ? '✅ Set' : '❌ Missing'}`);

  if (!hasPrimary && !hasSecondary) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'No Gemini API keys configured. Set GEMINI_API_KEY_PRIMARY or GEMINI_API_KEY_SECONDARY in .env.local',
        help: 'Get a free API key at https://ai.google.dev/',
      },
      { status: 400 }
    );
  }

  // Test Gemini API
  const testPrompt =
    'Respond with exactly: "Gemini API is working!" and nothing else.';

  try {
    console.log(`\nTesting Gemini API with prompt: "${testPrompt}"`);
    console.log('Waiting for response...\n');

    const response = await callGeminiAPI(testPrompt, {
      model: 'gemini-2.0-flash',
      maxTokens: 50,
      timeout: 10000,
    });

    console.log(`Response: ${response.text}`);
    console.log(`Source: ${response.source}\n`);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Gemini API is working!',
        response: response.text,
        source: response.source,
        apiKeys: {
          primary: hasPrimary,
          secondary: hasSecondary,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Test failed:', err.message);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Gemini API test failed',
        error: err.message,
        apiKeys: {
          primary: hasPrimary,
          secondary: hasSecondary,
        },
        help: 'Verify API keys are valid at https://ai.google.dev/',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemini-test
 * Detailed test with custom prompt
 * 
 * Usage:
 *   curl -X POST http://localhost:3000/api/gemini-test \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt": "What is 2+2?"}'
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`\n=== Custom Gemini API Test ===`);
    console.log(`Prompt: "${prompt}"\n`);

    const response = await callGeminiAPI(prompt, {
      model: 'gemini-2.0-flash',
      maxTokens: 500,
      timeout: 15000,
    });

    return NextResponse.json(
      {
        status: 'success',
        prompt: prompt,
        response: response.text,
        source: response.source,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Custom test failed:', err.message);
    return NextResponse.json(
      {
        status: 'error',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
