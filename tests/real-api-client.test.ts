import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, realApi, request } from '../src/services/realApi';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('JWT login sends real username and password in JSON POST', async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), '/api/auth/login/');
    assert.equal(init?.method, 'POST');
    assert.equal(JSON.parse(String(init?.body)).username, 'empregador');
    assert.equal(JSON.parse(String(init?.body)).password, 'PasswordTest123');
    assert.equal((init?.headers as Record<string,string>)['Content-Type'], 'application/json');
    return new Response(JSON.stringify({ access: 'jwt-access', refresh: 'jwt-refresh' }), { status: 200 });
  };
  assert.equal((await realApi.login('empregador', 'PasswordTest123')).access, 'jwt-access');
});

test('authenticated requests pass bearer access token and no browser credentials', async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), '/api/contracts/engagements/');
    assert.equal((init?.headers as Record<string,string>).Authorization, 'Bearer real-token');
    assert.equal(init?.credentials, 'omit');
    return new Response(JSON.stringify([]), { status: 200 });
  };
  assert.deepEqual(await realApi.engagements('real-token'), []);
});

test('acceptance confirms exact agreement fingerprint from API, not fabricated signature', async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), '/api/contracts/engagements/4/agreements/7/accept/');
    assert.deepEqual(JSON.parse(String(init?.body)), { content_fingerprint: 'a'.repeat(64) });
    return new Response(JSON.stringify({ engagement_status: 'ACTIVE' }), { status: 200 });
  };
  await realApi.acceptAgreement('token', 4, {
    id: 7, number: 2, status: 'PROPOSED', scope: 'Portal web', amount: '2000.00',
    is_current: false, price_after_diagnosis: false,
    content_fingerprint: 'a'.repeat(64), proposed_by_user_id: 1,
    rejected_by_user_id: null, rejected_at: null, rejection_reason: '', acceptances: [],
  });
});

test('403 and 409 from API are not silently swallowed', async () => {
  for (const status of [403,409]) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: 'Operation rejected' }), { status });
    await assert.rejects(
      request('/api/test/', { access: 'token' }),
      (error: unknown) => error instanceof ApiError && error.status === status && error.message === 'Operation rejected'
    );
  }
});

test('unavailable API reports networking error without returning mock data', async () => {
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  await assert.rejects(realApi.opportunities('token'), (error: unknown) =>
    error instanceof ApiError && error.status === 0
  );
});

test('HTML returned for /api is rejected as misconfigured proxy', async () => {
  globalThis.fetch = async () => new Response('<html>vite fallback</html>', { status: 200 });
  await assert.rejects(realApi.me('token'), (error: unknown) =>
    error instanceof ApiError && error.message.includes('proxy')
  );
});
