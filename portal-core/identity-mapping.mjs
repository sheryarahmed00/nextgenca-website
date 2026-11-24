/**
 * Resolve a session already cryptographically verified by a trusted identity
 * provider middleware. Never accept these fields from request JSON.
 */
export async function resolveCustomerAccount({ db, verifiedSession }) {
  if (verifiedSession?.serverValidated !== true ||
      typeof verifiedSession.provider !== 'string' || !verifiedSession.provider ||
      typeof verifiedSession.subject !== 'string' || !verifiedSession.subject ||
      verifiedSession.emailVerified !== true) throw new Error('verified_identity_required');
  const account = await db.maybeOne(
    `SELECT id,disabled,email_verified FROM portal_private.customer_accounts
     WHERE provider=$1 AND provider_subject=$2`,
    [verifiedSession.provider, verifiedSession.subject]
  );
  if (!account || account.disabled || !account.email_verified) throw new Error('account_not_ready');
  return { id: account.id, emailVerified: true, serverValidated: true };
}
/** Admin role must be loaded from a separate privileged role table, not user metadata. */
export async function resolveAdminAccount({ db, verifiedSession }) {
  const customer = await resolveCustomerAccount({db,verifiedSession});
  if (verifiedSession.mfaVerified !== true) throw new Error('admin_mfa_required');
  const role = await db.maybeOne(
    'SELECT account_id FROM portal_private.admin_roles WHERE account_id=$1 AND revoked_at IS NULL',
    [customer.id]
  );
  if (!role) throw new Error('admin_access_denied');
  return {...customer,isAdmin:true,mfaVerified:true};
}
