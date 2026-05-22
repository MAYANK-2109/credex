import { POST as leadsPost } from '@/app/api/leads/route';
import { POST as sharesPost } from '@/app/api/shares/route';

const makeRequest = (body: object) => {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('/api/leads', () => {
  test('returns 400 when required fields are missing', async () => {
    const response = await leadsPost(makeRequest({ companyName: 'Acme' }));
    expect(response.status).toBe(400);
  });

  test('returns 200 when valid lead payload is submitted', async () => {
    const response = await leadsPost(
      makeRequest({
        email: 'test@example.com',
        companyName: 'Acme',
        role: 'Product',
        teamSize: 5,
        primaryUseCase: 'coding',
        toolCount: 2,
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Lead saved');
  });
});

describe('/api/shares', () => {
  test('returns id for a valid share payload', async () => {
    const response = await sharesPost(makeRequest({ tools: [] }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThanOrEqual(6);
  });
});
