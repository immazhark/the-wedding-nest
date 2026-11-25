/**
 * DORMANT email transport: no Worker route, cron, binding or database consumer.
 * One attempt only; a future consumer owns leases, durable snapshots and retries.
 * Acceptance is not proof of inbox delivery. Never log payloads/provider bodies.
 */
import type { OperatorNotice } from "./notification-content";

export interface EmailConfiguration {
  enabled?: string | undefined;
  apiKey?: string | undefined;
  domainVerified: boolean;
}

export interface OperatorEmailEvent {
  /** Receipt probes use a separate provider key namespace and an explicit test subject. */
  purpose?: "receipt-test";
  id: string;
  /** Immutable outbox creation time; never refresh this on retry. */
  createdAt: string;
  /** Persist an immutable notice snapshot before first send in a future consumer. */
  notice: OperatorNotice;
}

export type EmailAttemptResult =
  | { status: "accepted"; providerId: string }
  | { status: "retry"; reason: "network" | "provider" | "response" }
  | { status: "blocked"; reason: "configuration" | "event" | "provider" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Resend retains keys for 24h. Stop at 23h from creation, even if never sent.
const MAX_EVENT_AGE_MS = 23 * 60 * 60_000;

/** Version the fixed sender/recipient and notice contract; never replay old snapshots under a new contract. */
export const EMAIL_NOTICE_VERSION = 1;

export function isEmailConfigured(config: EmailConfiguration): boolean {
  return (
    config.enabled === "true" &&
    config.domainVerified === true &&
    typeof config.apiKey === "string" &&
    /^re_[A-Za-z0-9_-]+$/.test(config.apiKey)
  );
}

/** Not imported by the deployed Worker. A caller must explicitly enable it. */
export async function sendOperatorEmail(
  config: EmailConfiguration,
  event: OperatorEmailEvent,
  now: Date,
  fetcher: typeof fetch = fetch,
): Promise<EmailAttemptResult> {
  if (!isEmailConfigured(config)) return { status: "blocked", reason: "configuration" };
  const createdAt = Date.parse(event.createdAt);
  const age = now.getTime() - createdAt;
  if (
    (event.purpose !== undefined && event.purpose !== "receipt-test") ||
    !UUID.test(event.id) ||
    !UUID.test(event.notice.enquiryId) ||
    !Number.isFinite(age) ||
    age < 0 ||
    age >= MAX_EVENT_AGE_MS ||
    new Date(createdAt).toISOString() !== event.createdAt ||
    !/^The Wedding Nest \| New enquiry [A-F0-9]{8}$/.test(event.notice.subject) ||
    event.notice.subject !==
      `The Wedding Nest | New enquiry ${event.notice.enquiryId.slice(0, 8).toUpperCase()}` ||
    event.notice.text.length === 0 ||
    event.notice.text.length > 32_000
  ) {
    return { status: "blocked", reason: "event" };
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<EmailAttemptResult>((resolve) => {
    timer = setTimeout(() => {
      resolve({ status: "retry", reason: "network" });
      controller.abort();
    }, 10_000);
  });
  const attempt = async (): Promise<EmailAttemptResult> => {
    let response: Response;
    try {
      response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `${event.purpose === "receipt-test" ? "twn-receipt" : "twn-enquiry"}/${event.id.toLowerCase()}`,
        },
        body: JSON.stringify({
          from: "The Wedding Nest <enquiries@theweddingnest.in>",
          to: ["theweddingnest.events@gmail.com"],
          reply_to: "theweddingnest.events@gmail.com",
          subject:
            event.purpose === "receipt-test"
              ? `[TEST] ${event.notice.subject}`
              : event.notice.subject,
          text: event.notice.text,
        }),
      });
    } catch {
      return { status: "retry", reason: "network" };
    }
    if (controller.signal.aborted) {
      void response.body?.cancel().catch(() => {});
      return { status: "retry", reason: "network" };
    }
    if (!response.ok) void response.body?.cancel().catch(() => {});
    if (response.status === 429 || response.status >= 500) {
      return { status: "retry", reason: "provider" };
    }
    // Includes configuration/authentication errors and ambiguous idempotency conflicts.
    // Hold for review; never change keys to circumvent a provider conflict.
    if (!response.ok) return { status: "blocked", reason: "provider" };
    try {
      const data: unknown = await response.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        typeof data.id === "string" &&
        UUID.test(data.id)
      ) {
        return { status: "accepted", providerId: data.id };
      }
    } catch {
      // A malformed 2xx may still represent acceptance. Retry with the same key.
    }
    return { status: "retry", reason: "response" };
  };
  try {
    return await Promise.race([attempt(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
