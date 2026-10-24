// Minimal PayPal sandbox REST helper for the day-1 spikes.
// Run with: node --env-file=.env.local scripts/spikes/<spike>.mjs
const BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
let cached;

export async function token() {
  if (cached && cached.exp > Date.now()) return cached.value;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${JSON.stringify(body)}`);
  cached = { value: body.access_token, exp: Date.now() + (body.expires_in - 60) * 1000, scope: body.scope, app_id: body.app_id };
  return cached.value;
}
export const tokenInfo = () => cached;

export async function pp(method, path, { body, headers = {}, raw } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      ...(raw ? {} : { "Content-Type": "application/json" }),
      Prefer: "return=representation",
      ...headers,
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  const debugId = res.headers.get("paypal-debug-id");
  if (!res.ok) { const e = new Error(`${method} ${path} → ${res.status} (debug ${debugId}): ${typeof json === "string" ? json : JSON.stringify(json)}`); e.status = res.status; e.body = json; throw e; }
  return { status: res.status, json, debugId };
}

export function step(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
