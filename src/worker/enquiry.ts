/**
 * POST /api/enquiry — server-side enquiry intake.
 *
 * Order of checks (cheapest and most security-relevant first):
 * method → kill switch/config → origin → content type → size → JSON → idempotency key →
 * duplicate payload check → Turnstile (server-side) → shared validation → one D1 transaction
 * (enquiry + outbox event). A 2xx means the database accepted the enquiry — not that any
 * notification was delivered. Responses and logs never contain personal data.
 */
import { validateEnquiry } from "../lib/enquiry/validate";
import type { D1Like, RateLimiterLike } from "./types";

export interface EnquiryEnv {
  /** Must be exactly "true". Live submission is owner-gated; production defaults to off. */
  ENQUIRIES_ENABLED?: string | undefined;
  /** Comma-separated exact origins allowed to POST, e.g. "https://staging.example". */
  ALLOWED_ORIGINS?: string | undefined;
  /** Secret (wrangler secret put TURNSTILE_SECRET), never in code or vars. */
  TURNSTILE_SECRET?: string | undefined;
  DB?: D1Like | undefined;
  ENQUIRY_RATE_LIMITER?: RateLimiterLike | undefined;
}

export interface EnquiryDeps {
  fetch: typeof fetch;
  /** Structured log sink; callers must only pass non-personal fields. */
  log: (entry: Record<string, string | number | boolean>) => void;
}

export const MAX_BODY_BYTES = 16 * 1024;
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 10_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Bound both the network request and response body, even if the transport ignores abort. */
async function verifyTurnstile(
  form: FormData,
  fetcher: typeof fetch,
): Promise<{ success?: boolean }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error("verification_timeout"));
      controller.abort();
    }, SITEVERIFY_TIMEOUT_MS);
  });
  const verification = (async () => {
    const response = await fetcher(SITEVERIFY, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    // A transport that ignores cancellation must not start consuming a late response.
    if (controller.signal.aborted) throw new Error("verification_timeout");
    return (await response.json()) as { success?: boolean };
  })();
  try {
    return await Promise.race([verification, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/** Also bound slow or stalled upload streams, not just their total byte length. */
export const BODY_READ_TIMEOUT_MS = 10_000;
class BodyReadTimeout extends Error {}

/** Enforce a total time and byte limit while consuming untrusted request streams. */
async function readBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();

  // Keep the actual read separate from the deadline: a misbehaving transport
  // can ignore cancellation, but must never delay the handler's 408 response.
  const read = async (): Promise<string | null> => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES) {
          // Cancellation is best effort, including streams that ignore it.
          void reader.cancel().catch(() => {});
          return null;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      // Settle the timeout first: a late successful read must not be accepted.
      reject(new BodyReadTimeout());
      void reader.cancel().catch(() => {});
    }, BODY_READ_TIMEOUT_MS);
  });
  try {
    return await Promise.race([read(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
  });

export async function handleEnquiry(
  request: Request,
  env: EnquiryEnv,
  deps: EnquiryDeps,
): Promise<Response> {
  const fail = (status: number, error: string, extra: Record<string, string> = {}) => {
    deps.log({ event: "enquiry", outcome: error, status });
    return json(status, { error }, extra);
  };

  if (request.method !== "POST") return fail(405, "method_not_allowed", { allow: "POST" });

  if (env.ENQUIRIES_ENABLED !== "true") return fail(503, "enquiries_disabled");
  if (!env.DB || !env.TURNSTILE_SECRET || !env.ALLOWED_ORIGINS) return fail(503, "not_configured");

  const origins = env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = request.headers.get("origin");
  if (!origin || !origins.includes(origin)) return fail(403, "forbidden_origin");

  // Compare the actual MIME type, not a prefix (application/jsonp is not JSON).
  // Parameterised values such as application/json; charset=UTF-8 remain valid.
  const mediaType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") return fail(415, "unsupported_media_type");

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return fail(413, "payload_too_large");
  let raw: string | null;
  try {
    raw = await readBody(request);
  } catch (error) {
    if (error instanceof BodyReadTimeout) return fail(408, "request_timeout");
    return fail(400, "invalid_body");
  }
  if (raw === null) return fail(413, "payload_too_large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_json");
  }
  if (typeof body !== "object" || body === null) return fail(400, "invalid_json");

  const key = request.headers.get("idempotency-key") ?? "";
  if (!UUID.test(key)) return fail(400, "invalid_idempotency_key");

  const ip = request.headers.get("cf-connecting-ip") ?? "";
  if (env.ENQUIRY_RATE_LIMITER) {
    try {
      const { success } = await env.ENQUIRY_RATE_LIMITER.limit({ key: ip || "unknown" });
      if (!success) return fail(429, "rate_limited", { "retry-after": "60" });
    } catch {
      return fail(503, "rate_limit_unavailable");
    }
  }

  const db = env.DB;

  // A reused key is a retry only for the SAME normalised enquiry.
  // Checking only the key could return a 200 for a different name, phone or
  // consent choice and falsely imply those changed details were saved.
  // We can safely skip single-use Turnstile on an exact retry, but not content checks.
  const acknowledgeExisting = (existing: { id: string; payload_json: string }): Response => {
    const incoming = validateEnquiry((body as Record<string, unknown>)["enquiry"]);
    if (!incoming.ok) {
      deps.log({ event: "enquiry", outcome: "invalid", status: 422 });
      return json(422, { error: "invalid_enquiry", errors: incoming.errors });
    }
    if (JSON.stringify(incoming.value) !== existing.payload_json)
      return fail(409, "idempotency_conflict");

    deps.log({ event: "enquiry", outcome: "duplicate", status: 200 });
    return json(200, { id: existing.id });
  };

  try {
    // A safe retry (same key) returns the original id without re-verifying a single-use token.
    const existing = await db
      .prepare("SELECT id, payload_json FROM enquiries WHERE idempotency_key = ?1")
      .bind(key)
      .first<{ id: string; payload_json: string }>();
    if (existing) return acknowledgeExisting(existing);
  } catch {
    return fail(503, "storage_unavailable");
  }

  const token = (body as Record<string, unknown>)["turnstileToken"];
  if (typeof token !== "string" || token.length === 0 || token.length > 2048)
    return fail(403, "verification_failed");
  try {
    const form = new FormData();
    form.set("secret", env.TURNSTILE_SECRET);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);
    form.set("idempotency_key", key);
    const outcome = await verifyTurnstile(form, deps.fetch);
    if (outcome.success !== true) return fail(403, "verification_failed");
  } catch {
    return fail(503, "verification_unavailable");
  }

  const result = validateEnquiry((body as Record<string, unknown>)["enquiry"]);
  if (!result.ok) {
    deps.log({ event: "enquiry", outcome: "invalid", status: 422 });
    return json(422, { error: "invalid_enquiry", errors: result.errors });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const [inserted] = await db.batch([
      db
        .prepare(
          "INSERT INTO enquiries (id, idempotency_key, created_at, payload_json, consent_at, marketing_consent) " +
            "VALUES (?1, ?2, ?3, ?4, ?3, ?5) ON CONFLICT(idempotency_key) DO NOTHING",
        )
        .bind(id, key, now, JSON.stringify(result.value), result.value.marketingConsent ? 1 : 0),
      db
        .prepare(
          "INSERT INTO outbox (id, enquiry_id, kind, created_at) " +
            "SELECT ?1, ?2, 'enquiry.created', ?3 WHERE EXISTS (SELECT 1 FROM enquiries WHERE id = ?2)",
        )
        .bind(crypto.randomUUID(), id, now),
    ]);
    if (!inserted || inserted.meta.changes === 0) {
      // Lost a race with a concurrent request using the same key.
      const row = await db
        .prepare("SELECT id, payload_json FROM enquiries WHERE idempotency_key = ?1")
        .bind(key)
        .first<{ id: string; payload_json: string }>();
      if (!row) return fail(503, "storage_unavailable");
      return acknowledgeExisting(row);
    }
  } catch {
    return fail(503, "storage_unavailable");
  }

  // Keep the durable identifier in the response/DB, not operational logs.
  deps.log({ event: "enquiry", outcome: "accepted", status: 201 });
  return json(201, { id });
}
