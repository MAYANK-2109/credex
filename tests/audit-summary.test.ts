'use strict';

import { POST as auditPost } from '@/app/api/audit-summary/route';

test('/api/audit-summary returns 400 when no result is provided', async () => {
  const request = new Request('http://localhost/api/audit-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamSize: 5, primaryUseCase: 'coding' }),
  });

  const response = await auditPost(request);
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.error).toBe('Audit result is required');
});

test('/api/audit-summary returns fallback text when Gemini API keys are missing', async () => {
  delete process.env.GEMINI_API_KEY_PRIMARY;
  delete process.env.GEMINI_API_KEY_SECONDARY;

  const result = {
    currentMonthlySpend: 1200,
    currentAnnualSpend: 14400,
    totalMonthlySavings: 350,
    totalAnnualSavings: 4200,
    wasteScore: 65,
    wasteCategory: 'Moderate',
    recommendations: [
      { toolName: 'Claude', recommendedAction: 'Downgrade to Pro', monthlySavings: 120, reason: 'Overprovisioned seats' },
    ],
  };

  const request = new Request('http://localhost/api/audit-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, teamSize: 5, primaryUseCase: 'coding' }),
  });

  const response = await auditPost(request);
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(typeof body.text).toBe('string');
  expect(body.text.length).toBeGreaterThan(0);
  expect(body.source).toBe('fallback');
});

test('/api/audit-summary returns full response without truncation', async () => {
  delete process.env.GEMINI_API_KEY_PRIMARY;
  delete process.env.GEMINI_API_KEY_SECONDARY;

  const result = {
    currentMonthlySpend: 5000,
    currentAnnualSpend: 60000,
    totalMonthlySavings: 1500,
    totalAnnualSavings: 18000,
    wasteScore: 72,
    wasteCategory: 'High',
    recommendations: [
      { toolName: 'GitHub Copilot', recommendedAction: 'Consolidate from Business to Individual', monthlySavings: 800, reason: 'Excessive seats for team size' },
      { toolName: 'Claude', recommendedAction: 'Downgrade to Pro', monthlySavings: 400, reason: 'Team plan underutilized' },
      { toolName: 'ChatGPT', recommendedAction: 'Review Plus vs Team pricing', monthlySavings: 300, reason: 'Duplicate tooling with Claude' },
    ],
  };

  const request = new Request('http://localhost/api/audit-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, teamSize: 8, primaryUseCase: 'coding' }),
  });

  const response = await auditPost(request);
  expect(response.status).toBe(200);
  const body = await response.json();
  
  // Response should be a string and not empty
  expect(typeof body.text).toBe('string');
  expect(body.text.trim().length).toBeGreaterThan(50);
  
  // Since Gemini keys aren't available in test, verify fallback has complete sentences
  const responseText = body.text;
  expect(responseText).toMatch(/\./); // Should have punctuation marks
  expect(responseText.split('.').length).toBeGreaterThan(2); // Multiple sentences
});

