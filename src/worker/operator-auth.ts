/**
 * Operator authentication: verifies the Cloudflare Access JWT (Cf-Access-Jwt-Assertion) with
 * WebCrypto. Access gates the route at the edge; this re-checks signature, issuer, audience,
 * expiry and an explicit email allow-list so a misconfigured Access policy cannot expose data.
 * Every failure returns null (fail closed); nothing from the token is logged.
 */
export interface OperatorAuthEnv {
  /** e.g. "yourteam.cloudflareaccess.com" */
  OPERATOR_ACCESS_TEAM_DOMAIN?: string | undefined;
  /** Application Audience (AUD) tag of the Access application. */
  OPERATOR_ACCESS_AUD?: string | undefined;
  /** Comma-separated operator email allow-list (owner + backup). */
  OPERATOR_EMAILS?: string | undefined;
}

export interface OperatorAuthDeps {
  keys: (teamDomain: string) => Promise<(JsonWebKey & { kid?: string })[]>;
  now: () => number;
}

const TEAM_DOMAIN = /^[a-z0-9-]+\.cloudflareaccess\.com$/;
const MAX_TOKEN = 8192;

const decode = (part: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const parse = (part: string): Record<string, unknown> | null => {
  const v: unknown = JSON.parse(new TextDecoder().decode(decode(part)));
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
};

/** Returns the verified, lower-cased operator email, or null. */
export async function authenticateOperator(
  request: Request,
  env: OperatorAuthEnv,
  deps: OperatorAuthDeps,
): Promise<string | null> {
  try {
    const team = env.OPERATOR_ACCESS_TEAM_DOMAIN?.trim().toLowerCase();
    const aud = env.OPERATOR_ACCESS_AUD?.trim();
    const allowed = (env.OPERATOR_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const token = request.headers.get("cf-access-jwt-assertion");
    if (!team || !TEAM_DOMAIN.test(team) || !aud || allowed.length === 0) return null;
    if (!token || token.length > MAX_TOKEN) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts as [string, string, string];
    const header = parse(h);
    if (header?.alg !== "RS256" || typeof header.kid !== "string") return null;

    const jwk = (await deps.keys(team)).find((k) => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      decode(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!ok) return null;

    const c = parse(p);
    const now = deps.now();
    if (!c || c.iss !== `https://${team}`) return null;
    const audiences = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!audiences.includes(aud)) return null;
    if (typeof c.exp !== "number" || c.exp <= now) return null;
    if (c.nbf !== undefined && (typeof c.nbf !== "number" || c.nbf > now)) return null;
    const email = typeof c.email === "string" ? c.email.toLowerCase() : "";
    return allowed.includes(email) ? email : null;
  } catch {
    return null;
  }
}
