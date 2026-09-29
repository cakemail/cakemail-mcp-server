// ABOUTME: Tests that a Personal Access Token (ck_pat_…) is sent as a Bearer credential with no /token exchange.
// ABOUTME: Guards the PAT path documented in the README, and the password path kept for existing configs.

import { describe, it, expect, beforeEach } from '@jest/globals';
import mockFetch from 'node-fetch';
import { BaseApiClient } from '../../src/api/base-client.js';
import { resolveCredentials } from '../../src/utils/credentials.js';

const fetchMock = mockFetch as any;

const jsonResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'OK',
  headers: { get: () => 'application/json' },
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

class TestClient extends BaseApiClient {
  request(endpoint: string, options: any = {}) {
    return this.makeRequest(endpoint, options);
  }
}

const PAT = 'ck_pat_0123456789abcdef0123456789abcdef01234567';

// withTimeout leaves its timer running after the request settles; keep it short so Jest can exit
const TIMEOUT = 10;

describe('PAT authentication', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('sends the PAT as Authorization: Bearer and never calls /token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ submitted: true }, 201));
    const client = new TestClient({ apiKey: PAT, timeout: TIMEOUT });

    await client.request('/v2/emails', { method: 'POST', body: '{}' });

    const urls = fetchMock.mock.calls.map((call: any[]) => call[0]);
    expect(urls).not.toContain('https://api.cakemail.dev/token');
    expect(urls).toEqual(['https://api.cakemail.dev/v2/emails']);
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe(`Bearer ${PAT}`);
  });

  it('reports a PAT as a token that never needs refreshing', () => {
    const status = new TestClient({ apiKey: PAT }).getTokenStatus();
    expect(status.hasToken).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.needsRefresh).toBe(false);
  });

  it('still exchanges email and password at /token when no PAT is configured', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'jwt', token_type: 'bearer', expires_in: 3600, refresh_token: 'r', accounts: [1]
      }))
      .mockResolvedValueOnce(jsonResponse({ data: {} }));
    const client = new TestClient({ email: 'a@example.com', password: 'pw', timeout: TIMEOUT });

    await client.request('/accounts/self');

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.cakemail.dev/token');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer jwt');
  });
});

describe('resolveCredentials', () => {
  it('uses CAKEMAIL_API_KEY when set', () => {
    expect(resolveCredentials({ CAKEMAIL_API_KEY: PAT })).toEqual({ apiKey: PAT });
  });

  it('prefers the PAT and drops the password when both are set', () => {
    expect(resolveCredentials({
      CAKEMAIL_API_KEY: PAT, CAKEMAIL_EMAIL: 'a@example.com', CAKEMAIL_PASSWORD: 'pw'
    })).toEqual({ apiKey: PAT });
  });

  it('falls back to CAKEMAIL_EMAIL and CAKEMAIL_PASSWORD', () => {
    expect(resolveCredentials({ CAKEMAIL_EMAIL: 'a@example.com', CAKEMAIL_PASSWORD: 'pw' }))
      .toEqual({ email: 'a@example.com', password: 'pw' });
  });

  it('names CAKEMAIL_API_KEY when no credential is set', () => {
    expect(() => resolveCredentials({})).toThrow(/CAKEMAIL_API_KEY/);
  });
});
