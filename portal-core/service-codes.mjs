import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateServiceCode() {
  // 256 bits of cryptographic randomness. Return only once to the authorised issuer.
  return randomBytes(32).toString('base64url');
}

export function digestServiceCode(code, serverSecret) {
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
    throw new Error('Invalid service code format');
  }
  if (typeof serverSecret !== 'string' || serverSecret.length < 32) {
    throw new Error('A strong server-side secret is required');
  }
  return createHmac('sha256', serverSecret).update(code, 'utf8').digest('hex');
}

export function codeDigestMatches(code, expectedDigest, serverSecret) {
  if (typeof expectedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(expectedDigest)) return false;
  try {
    const actual = Buffer.from(digestServiceCode(code, serverSecret), 'hex');
    return timingSafeEqual(actual, Buffer.from(expectedDigest, 'hex'));
  } catch {
    return false;
  }
}

/**
 * This module is ONLY a cryptographic primitive, not an access-control system.
 * Issuance/redeeming MUST happen server-side, with authenticated customer binding,
 * atomic single-use DB transactions, verified orders, rate limiting and audit logs.
 */
