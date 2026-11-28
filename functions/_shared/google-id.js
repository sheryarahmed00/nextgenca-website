// Verifies a Google ID token (from ScriptApp.getIdentityToken() in Apps Script).
// Checks: RS256 signature against Google's published keys, issuer, expiry,
// email_verified. Returns the token claims or null.

const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let cache = { at: 0, keys: null };

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function googleKeys() {
  if (cache.keys && Date.now() - cache.at < 60 * 60 * 1000) return cache.keys;
  const r = await fetch(CERTS_URL);
  if (!r.ok) throw new Error("Could not load Google keys");
  cache = { at: Date.now(), keys: (await r.json()).keys || [] };
  return cache.keys;
}

export async function verifyGoogleIdToken(token, keys) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || token.length > 4096) return null;
  let header, claims;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch { return null; }
  if (header.alg !== "RS256" || !header.kid) return null;
  const jwk = (keys || await googleKeys()).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  if (!ISSUERS.includes(claims.iss)) return null;
  if (!claims.exp || claims.exp < now - 60 || (claims.iat && claims.iat > now + 300)) return null;
  if (!claims.email || (claims.email_verified !== true && claims.email_verified !== "true")) return null;
  if (!claims.aud) return null;
  return claims;
}
