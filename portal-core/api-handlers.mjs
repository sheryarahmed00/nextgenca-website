import { resolveCustomerAccount, resolveAdminAccount } from './identity-mapping.mjs';
import { registerDirectOrder, approveDirectOrder } from './direct-orders.mjs';
import { issueServiceCode, redeemServiceCode } from './redemption-service.mjs';
import { requireActiveService } from './access-policy.mjs';

/**
 * Framework-independent API operations. The HTTP boundary MUST:
 * - cryptographically verify the session with the chosen identity provider
 * - construct verifiedSession on the server (never from request JSON)
 * - enforce CSRF protections for cookie sessions and rate limit redemption
 * - reject unknown JSON fields and validate UUIDs
 * - map internal errors to generic public responses
 * No actual HTTP server, auth provider, email delivery or rate limiter is wired.
 */
export function createPortalHandlers({ db, secret, rateLimit }) {
  if (!db?.transaction || !db?.maybeOne || typeof rateLimit !== 'function') {
    throw new Error('missing_secure_dependencies');
  }
  async function customer(session) { return resolveCustomerAccount({ db, verifiedSession: session }); }
  async function admin(session) { return resolveAdminAccount({ db, verifiedSession: session }); }
  return {
    async createDirectOrder({ verifiedSession, body }) {
      const actor = await admin(verifiedSession);
      return registerDirectOrder({ db, admin: actor, input: body });
    },
    async approveDirectOrder({ verifiedSession, body }) {
      const actor = await admin(verifiedSession);
      return approveDirectOrder({ db, admin: actor, orderId: body.orderId, verificationConfirmed: body.verificationConfirmed });
    },
    async issueCode({ verifiedSession, body }) {
      const actor = await admin(verifiedSession);
      return issueServiceCode({ db, actor, orderItemId: body.orderItemId, customerId: body.customerId, mode: 'manual', secret, expiresAt: new Date(body.expiresAt) });
    },
    async redeemCode({ verifiedSession, body }) {
      const user = await customer(verifiedSession);
      // Fail closed: rate limiter must explicitly allow the attempt.
      const allowed = await rateLimit({ scope: 'code-redemption', accountId: user.id });
      if (allowed !== true) throw new Error('too_many_attempts');
      try {
        return await redeemServiceCode({ db, user, code: body.code, secret });
      } catch {
        throw new Error('invalid_or_unavailable_code');
      }
    },
    async checkService({ verifiedSession, serviceId }) {
      const user = await customer(verifiedSession);
      return requireActiveService({ context: { user, serverValidated: true }, db, serviceId });
    }
  };
}
