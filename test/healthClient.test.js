'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getHealth, HealthClientError } = require('../src/healthClient');

// sandbox-a 交付（PR #7）的示例响应
const SAMPLE = '{"ok":true,"uptime":123}';

function mockFetch({ status = 200, body = SAMPLE, error } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    if (error) throw error;
    return new Response(body, {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  fn.calls = calls;
  return fn;
}

async function expectError(promise, code) {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof HealthClientError);
    assert.equal(err.code, code);
    return true;
  });
}

test('parses sandbox-a sample response and returns ok and uptime', async () => {
  const fetch = mockFetch();
  const result = await getHealth('http://sandbox-a.local:3000', { fetch });
  assert.deepEqual(result, { ok: true, uptime: 123 });
  assert.equal(fetch.calls.length, 1);
  assert.equal(fetch.calls[0].url, 'http://sandbox-a.local:3000/health');
  assert.equal(fetch.calls[0].init.method, 'GET');
});

test('accepts uptime 0 (just after restart) and drops extra fields', async () => {
  const fetch = mockFetch({ body: '{"ok":true,"uptime":0,"extra":1}' });
  assert.deepEqual(await getHealth('http://x', { fetch }), { ok: true, uptime: 0 });
});

test('request failure -> REQUEST_FAILED', async () => {
  const fetch = mockFetch({ error: new TypeError('fetch failed') });
  await expectError(getHealth('http://x', { fetch }), 'REQUEST_FAILED');
});

test('non-2xx status -> HTTP_STATUS with status', async () => {
  for (const status of [404, 500, 503]) {
    const fetch = mockFetch({ status, body: '{"ok":false}' });
    await assert.rejects(getHealth('http://x', { fetch }), (err) => {
      assert.equal(err.code, 'HTTP_STATUS');
      assert.equal(err.status, status);
      return true;
    });
  }
});

test('invalid or non-object JSON -> INVALID_JSON', async () => {
  for (const body of ['not json', 'null', '[1,2]', '"ok"']) {
    await expectError(getHealth('http://x', { fetch: mockFetch({ body }) }), 'INVALID_JSON');
  }
});

test('missing fields -> MISSING_FIELD', async () => {
  for (const body of ['{"uptime":1}', '{"ok":true}', '{}']) {
    await expectError(getHealth('http://x', { fetch: mockFetch({ body }) }), 'MISSING_FIELD');
  }
});

test('wrong field types -> INVALID_FIELD', async () => {
  const bodies = [
    '{"ok":"true","uptime":1}',
    '{"ok":1,"uptime":1}',
    '{"ok":true,"uptime":"1"}',
    '{"ok":true,"uptime":1.5}',
    '{"ok":true,"uptime":-1}',
    '{"ok":true,"uptime":null}',
  ];
  for (const body of bodies) {
    await expectError(getHealth('http://x', { fetch: mockFetch({ body }) }), 'INVALID_FIELD');
  }
});

test('rejects empty baseUrl', async () => {
  await assert.rejects(getHealth(''), TypeError);
});
