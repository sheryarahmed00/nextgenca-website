/**
 * Supabase Auth verification for server routes.
 * Pass a server-side Supabase auth client with getClaims and getUser.
 * Never trust JWT payload decoded without signature verification.
 */
export function createSupabaseTokenVerifier({auth,issuer}){
  if(typeof auth?.getClaims!=='function'||typeof auth?.getUser!=='function'||typeof issuer!=='string'||!issuer.startsWith('https://'))throw Error('auth_configuration_required');
  return async function verifyBearerToken(token){
    if(typeof token!=='string'||token.length<20||token.length>8192)throw Error('invalid_token');
    const [{data:claimsData,error:claimsError},{data:userData,error:userError}]=await Promise.all([
      auth.getClaims(token),auth.getUser(token)
    ]);
    const claims=claimsData?.claims,user=userData?.user;
    if(claimsError||userError||!claims||!user||
       claims.iss!==issuer||claims.sub!==user.id||
       claims.role!=='authenticated'||!claims.session_id||
       !Number.isFinite(claims.exp)||claims.exp*1000<=Date.now()||
       !user.email_confirmed_at||!user.email)throw Error('invalid_verified_session');
    return {
      serverValidated:true,
      provider:'supabase',
      subject:user.id,
      emailVerified:true,
      // This is from cryptographically verified JWT claims, not user_metadata.
      mfaVerified:claims.aal==='aal2'
    };
  };
}
