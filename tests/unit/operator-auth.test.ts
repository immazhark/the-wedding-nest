import { beforeAll, describe, expect, it } from "vitest";
import { authenticateOperator, type OperatorAuthEnv } from "../../src/worker/operator-auth";

const TEAM = "twn.cloudflareaccess.com";
const AUD = "aud-tag-123";
const NOW = 1_800_000_000;
const env: OperatorAuthEnv = {
  OPERATOR_ACCESS_TEAM_DOMAIN: TEAM,
  OPERATOR_ACCESS_AUD: AUD,
  OPERATOR_EMAILS: "Owner@Example.com, backup@example.com",
};

let pair: CryptoKeyPair;
let jwk: JsonWebKey & { kid?: string };
const b64 = (b: ArrayBuffer | string) =>
  Buffer.from(typeof b === "string" ? b : new Uint8Array(b)).toString("base64url");

async function token(
  claims: Record<string, unknown>,
  header: Record<string, unknown> = {},
  key = pair.privateKey,
) {
  const h = b64(JSON.stringify({ alg: "RS256", kid: "k1", ...header }));
  const p = b64(
    JSON.stringify({
      iss: `https://${TEAM}`,
      aud: [AUD],
      exp: NOW + 600,
      nbf: NOW - 5,
      email: "owner@example.com",
      ...claims,
    }),
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${h}.${p}`),
  );
  return `${h}.${p}.${b64(sig)}`;
}
const req = (t?: string) =>
  new Request("https://x.test/api/operator/enquiries", {
    headers: t ? { "cf-access-jwt-assertion": t } : {},
  });
const auth = (t?: string, e: OperatorAuthEnv = env) =>
  authenticateOperator(req(t), e, { keys: async () => [jwk], now: () => NOW });

beforeAll(async () => {
  pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
});

describe("authenticateOperator", () => {
  it("accepts a valid token and returns the lower-cased allow-listed email", async () => {
    expect(await auth(await token({}))).toBe("owner@example.com");
    expect(await auth(await token({ email: "BACKUP@example.com" }))).toBe("backup@example.com");
  });
  it("fails closed without configuration or header", async () => {
    expect(await auth(undefined)).toBeNull();
    const t = await token({});
    expect(await auth(t, {})).toBeNull();
    expect(await auth(t, { ...env, OPERATOR_EMAILS: "" })).toBeNull();
    expect(await auth(t, { ...env, OPERATOR_ACCESS_TEAM_DOMAIN: "evil.example.com" })).toBeNull();
  });
  it.each([
    ["wrong audience", { aud: ["other"] }],
    ["wrong issuer", { iss: "https://evil.cloudflareaccess.com" }],
    ["expired", { exp: NOW - 1 }],
    ["not yet valid", { nbf: NOW + 60 }],
    ["no exp", { exp: undefined }],
    ["email not allow-listed", { email: "stranger@example.com" }],
    ["no email", { email: undefined }],
  ])("rejects %s", async (_n, claims) => {
    expect(await auth(await token(claims))).toBeNull();
  });
  it("rejects bad signature, unknown kid, alg none/HS256 and malformed tokens", async () => {
    const other = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );
    expect(await auth(await token({}, {}, other.privateKey))).toBeNull();
    expect(await auth(await token({}, { kid: "nope" }))).toBeNull();
    expect(await auth(await token({}, { alg: "none" }))).toBeNull();
    expect(await auth(await token({}, { alg: "HS256" }))).toBeNull();
    for (const bad of ["", "a.b", "a.b.c", "....", "x".repeat(10_000)])
      expect(await auth(bad)).toBeNull();
  });
  it("fails closed when key retrieval throws", async () => {
    const t = await token({});
    const r = await authenticateOperator(req(t), env, {
      keys: async () => {
        throw new Error("net");
      },
      now: () => NOW,
    });
    expect(r).toBeNull();
  });
});
