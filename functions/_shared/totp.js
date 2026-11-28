// Authenticator-app codes (TOTP, RFC 6238: SHA-1, 6 digits, 30-second steps) and
// password hashing (PBKDF2-SHA256) for client logins. The authenticator secret is
// stored encrypted (AES-GCM, key derived from the OTP_PEPPER secret).

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes) {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str) {
  const s = String(str).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0; const out = [];
  for (const c of s) {
    value = (value << 5) | B32.indexOf(c); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

export async function totpAt(secretBytes, step) {
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new ArrayBuffer(8); const v = new DataView(msg);
  v.setUint32(0, Math.floor(step / 2 ** 32)); v.setUint32(4, step >>> 0);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, "0");
}

// Returns the matching time step (to block re-use), or null. Accepts one step either side for clock drift.
export async function checkTotp(secretBytes, code, lastStep, nowMs = Date.now()) {
  const c = String(code || "").replace(/\D/g, "");
  if (c.length !== 6) return null;
  const cur = Math.floor(nowMs / 30000);
  for (const s of [cur, cur - 1, cur + 1]) {
    if (lastStep && s <= lastStep) continue;
    if ((await totpAt(secretBytes, s)) === c) return s;
  }
  return null;
}

async function aesKey(env) {
  if (!env.OTP_PEPPER || env.OTP_PEPPER.length < 24) throw new Error("OTP_PEPPER secret missing or too short");
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("totp-key:" + env.OTP_PEPPER));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = u8 => btoa(String.fromCharCode(...u8));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function sealSecret(env, secretBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), secretBytes));
  return b64(iv) + "." + b64(ct);
}
export async function openSecret(env, sealed) {
  const [iv, ct] = String(sealed).split(".");
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(env), unb64(ct)));
}

const ROUNDS = 100000;
export async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function passwordProblem(pw, email) {
  if (typeof pw !== "string" || pw.length < 10) return "Please use at least 10 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Please use letters and at least one number.";
  const local = String(email || "").split("@")[0].toLowerCase();
  if (local.length >= 4 && pw.toLowerCase().includes(local)) return "Please do not use your email in the password.";
  return null;
}
