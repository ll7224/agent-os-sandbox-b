'use strict';

/**
 * sandbox-a GET /health 客户端。
 *
 * 响应格式以 sandbox-a 正式交付为准（PR ll7224/agent-os-sandbox-a#7）：
 *   - ok:     布尔值，恒为 true
 *   - uptime: 非负整数，单位秒（Math.floor(process.uptime())，进程重启后从 0 计）
 *   示例：{"ok":true,"uptime":123}
 */

class HealthClientError extends Error {
  /**
   * @param {string} message
   * @param {{code: string, status?: number, cause?: unknown}} info
   */
  constructor(message, { code, status, cause } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'HealthClientError';
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

/**
 * 请求 sandbox-a 的 /health 并返回 { ok, uptime }。
 *
 * @param {string} baseUrl sandbox-a 服务地址，例如 "http://localhost:3000"
 * @param {{fetch?: typeof fetch, timeoutMs?: number}} [options]
 * @returns {Promise<{ok: boolean, uptime: number}>}
 * @throws {HealthClientError} code 取值：
 *   REQUEST_FAILED（网络错误/超时）、HTTP_STATUS（非 2xx）、
 *   INVALID_JSON（响应体不是 JSON 对象）、MISSING_FIELD、INVALID_FIELD
 */
async function getHealth(baseUrl, options = {}) {
  const { fetch: fetchImpl = globalThis.fetch, timeoutMs = 5000 } = options;
  if (typeof baseUrl !== 'string' || baseUrl === '') {
    throw new TypeError('baseUrl must be a non-empty string');
  }
  const url = new URL('/health', baseUrl).toString();

  let res;
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new HealthClientError(`request to ${url} failed: ${err && err.message}`, {
      code: 'REQUEST_FAILED',
      cause: err,
    });
  }

  if (!res.ok) {
    throw new HealthClientError(`GET ${url} returned HTTP ${res.status}`, {
      code: 'HTTP_STATUS',
      status: res.status,
    });
  }

  let body;
  try {
    body = await res.json();
  } catch (err) {
    throw new HealthClientError(`GET ${url} returned invalid JSON`, {
      code: 'INVALID_JSON',
      status: res.status,
      cause: err,
    });
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HealthClientError(`GET ${url} returned non-object JSON`, {
      code: 'INVALID_JSON',
      status: res.status,
    });
  }

  for (const field of ['ok', 'uptime']) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      throw new HealthClientError(`/health response missing field "${field}"`, {
        code: 'MISSING_FIELD',
        status: res.status,
      });
    }
  }
  if (typeof body.ok !== 'boolean') {
    throw new HealthClientError('/health field "ok" must be a boolean', {
      code: 'INVALID_FIELD',
      status: res.status,
    });
  }
  if (!Number.isInteger(body.uptime) || body.uptime < 0) {
    throw new HealthClientError('/health field "uptime" must be a non-negative integer (seconds)', {
      code: 'INVALID_FIELD',
      status: res.status,
    });
  }

  return { ok: body.ok, uptime: body.uptime };
}

module.exports = { getHealth, HealthClientError };
