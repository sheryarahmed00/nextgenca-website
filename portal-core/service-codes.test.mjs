import test from 'node:test';
import assert from 'node:assert/strict';
import { generateServiceCode, digestServiceCode, codeDigestMatches } from './service-codes.mjs';

const secret = 'test-secret-only-not-for-production-123456789';
test('codes are random and URL safe', () => {
  const a = generateServiceCode(), b = generateServiceCode();
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, b);
});
test('digest is deterministic, keyed and verifiable', () => {
  const code = generateServiceCode();
  const digest = digestServiceCode(code, secret);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(codeDigestMatches(code, digest, secret), true);
  assert.equal(codeDigestMatches(generateServiceCode(), digest, secret), false);
  assert.notEqual(digestServiceCode(code, 'different-test-secret-123456789000'), digest);
});
test('invalid codes and weak secrets fail closed', () => {
  assert.throws(() => digestServiceCode('short', secret));
  assert.throws(() => digestServiceCode(generateServiceCode(), 'weak'));
  assert.equal(codeDigestMatches('invalid', 'bad', secret), false);
});
