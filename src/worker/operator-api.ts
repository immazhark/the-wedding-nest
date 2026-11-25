/**
 * Authenticated operator API. The caller (index.ts) must verify the operator first via
 * operator-auth.ts; this module never authenticates. Reads customer data, so every response is
 * no-store and nothing personal is logged. Status writes reuse the compare-and-set primitives.
 */
import { prepareAdvanceEnquiryStatus } from "./operator-status";
import { prepareMarkEnquiryUnsuccessful } from "./privacy";
import type { D1Like, D1PreparedLike } from "./types";

export interface OperatorStatement extends D1PreparedLike {
  bind(...values: unknown[]): OperatorStatement;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
export interface OperatorD1 extends D1Like {
  prepare(sql: string): OperatorStatement;
}

export interface OperatorApiContext {
  db: OperatorD1;
  operator: string;
  now: () => string;
  log: (entry: Record<string, string | number | boolean>) => void;
}

const STATUSES = ["new", "contacted", "in_progress", "booked", "unsuccessful"] as const;
const ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const DETAIL = new RegExp(`^/api/operator/enquiries/(${ID})$`, "i");
const STATUS_PATH = new RegExp(`^/api/operator/enquiries/(${ID})/status$`, "i");
const MAX_BODY = 1024;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });

const parsePayload = (raw: string): Record<string, unknown> => {
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

export async function handleOperatorApi(
  request: Request,
  ctx: OperatorApiContext,
): Promise<Response> {
  const url = new URL(request.url);
  const { db } = ctx;

  if (url.pathname === "/api/operator/enquiries") {
    if (request.method !== "GET")
      return json(405, { error: "method_not_allowed" }, { allow: "GET" });
    const status = url.searchParams.get("status");
    if (status !== null && !(STATUSES as readonly string[]).includes(status)) {
      return json(400, { error: "invalid_status" });
    }
    const asked = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX_LIMIT) : DEFAULT_LIMIT;
    const before = url.searchParams.get("before");
    // Uses idx_enquiries_created_at; keyset (not OFFSET) paging stays O(limit).
    const { results } = await db
      .prepare(
        "SELECT id, created_at, status, payload_json FROM enquiries " +
          "WHERE (?1 IS NULL OR status = ?1) AND (?2 IS NULL OR created_at < ?2) " +
          "ORDER BY created_at DESC LIMIT ?3",
      )
      .bind(status, before, limit)
      .all<{ id: string; created_at: string; status: string; payload_json: string }>();
    return json(200, {
      enquiries: results.map((r) => {
        const p = parsePayload(r.payload_json);
        return {
          id: r.id,
          createdAt: r.created_at,
          status: r.status,
          name: typeof p.name === "string" ? p.name : "",
          occasions: Array.isArray(p.occasions) ? p.occasions : [],
        };
      }),
    });
  }

  const detail = DETAIL.exec(url.pathname);
  if (detail) {
    if (request.method !== "GET")
      return json(405, { error: "method_not_allowed" }, { allow: "GET" });
    const row = await db
      .prepare(
        "SELECT id, created_at, status, unsuccessful_at, marketing_consent, payload_json FROM enquiries WHERE id = ?1",
      )
      .bind(detail[1]!.toLowerCase())
      .first<{
        id: string;
        created_at: string;
        status: string;
        unsuccessful_at: string | null;
        marketing_consent: number;
        payload_json: string;
      }>();
    if (!row) return json(404, { error: "not_found" });
    // History is best-effort: a missing audit table must not hide the enquiry itself.
    const history = await db
      .prepare(
        "SELECT at, operator, from_status, to_status FROM operator_audit WHERE enquiry_id = ?1 ORDER BY id DESC LIMIT 20",
      )
      .bind(row.id)
      .all<{ at: string; operator: string; from_status: string; to_status: string }>()
      .then((r) =>
        r.results.map((h) => ({
          at: h.at,
          operator: h.operator,
          from: h.from_status,
          to: h.to_status,
        })),
      )
      .catch(() => []);
    return json(200, {
      history,
      enquiry: {
        id: row.id,
        createdAt: row.created_at,
        status: row.status,
        unsuccessfulAt: row.unsuccessful_at,
        marketingConsent: row.marketing_consent === 1,
        payload: parsePayload(row.payload_json),
      },
    });
  }

  const change = STATUS_PATH.exec(url.pathname);
  if (change) {
    if (request.method !== "POST")
      return json(405, { error: "method_not_allowed" }, { allow: "POST" });
    // CSRF: Access cookies are ambient, so require same-origin JSON.
    if (request.headers.get("origin") !== url.origin)
      return json(403, { error: "forbidden_origin" });
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
      return json(415, { error: "unsupported_media_type" });
    }
    const text = await request.text();
    if (text.length > MAX_BODY) return json(413, { error: "too_large" });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json(400, { error: "invalid_body" });
    }
    const { from, to } = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    const id = change[1]!.toLowerCase();
    const at = ctx.now();
    let update: D1PreparedLike;
    try {
      update =
        to === "unsuccessful"
          ? prepareMarkEnquiryUnsuccessful(db, id, from, at)
          : prepareAdvanceEnquiryStatus(db, id, from, to);
    } catch {
      return json(400, { error: "invalid_transition" });
    }
    let applied: boolean;
    try {
      // D1 batch executes sequentially in one transaction. SQLite changes()
      // refers to the preceding UPDATE; stale actions insert no audit row.
      const audit = db
        .prepare(
          "INSERT INTO operator_audit (at, operator, enquiry_id, from_status, to_status) " +
            "SELECT ?1, ?2, ?3, ?4, ?5 WHERE changes() = 1",
        )
        .bind(at, ctx.operator, id, String(from), String(to));
      const [updated, recorded] = await db.batch([update, audit]);
      const changes = updated?.meta.changes;
      if ((changes !== 0 && changes !== 1) || recorded?.meta.changes !== changes) {
        throw new Error("Unexpected operator batch result");
      }
      applied = changes === 1;
    } catch {
      ctx.log({ event: "operator", action: "status", outcome: "transaction_failed" });
      return json(503, { error: "status_update_unavailable" });
    }
    ctx.log({
      event: "operator",
      action: "status",
      to: String(to),
      outcome: applied ? "ok" : "conflict",
      enquiry: id,
    });
    return applied ? json(200, { ok: true }) : json(409, { error: "stale_or_missing" });
  }

  return json(404, { error: "not_found" });
}
