/**
 * Browser-side enquiry submission. A result of "accepted" only follows a 2xx response that
 * carries the stored enquiry id (the Worker returns that only after D1 accepted the row).
 */
import type { EnquiryState, StageId } from "./schema";
import type { ErrorCode } from "./validate";

export type SubmitResult =
  | { kind: "accepted"; id: string }
  | { kind: "invalid"; errors: Partial<Record<keyof EnquiryState, ErrorCode>> }
  | { kind: "verification" }
  | { kind: "retryable" }
  | { kind: "rejected" };

export const SUBMIT_TIMEOUT_MS = 15_000;
const ERROR_CODES: readonly ErrorCode[] = [
  "required",
  "invalid",
  "too_long",
  "not_available_for_occasion",
  "consent_required",
];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function submitEnquiry(
  enquiry: EnquiryState,
  turnstileToken: string,
  idempotencyKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitResult> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  // Aborting fetch is advisory: some transports or body decoders ignore the
  // signal. Race the entire request/response path so the UI always recovers.
  const deadline = new Promise<SubmitResult>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort();
      resolve({ kind: "retryable" });
    }, SUBMIT_TIMEOUT_MS);
  });
  const request = async (): Promise<SubmitResult> => {
    try {
      const res = await fetchFn("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ turnstileToken, enquiry }),
        credentials: "same-origin",
        signal: controller.signal,
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        return { kind: "retryable" };
      }
      if (!isRecord(body)) return { kind: "retryable" };
      if (res.ok) {
        return typeof body["id"] === "string" && body["id"].trim().length > 0
          ? { kind: "accepted", id: body["id"] }
          : { kind: "retryable" };
      }
      if (res.status === 422) {
        const errors = body["errors"];
        if (!isRecord(errors)) return { kind: "retryable" };
        const entries = Object.entries(errors);
        if (
          entries.length === 0 ||
          !entries.every(
            ([field, code]) =>
              Object.hasOwn(FIELD_STAGE, field) &&
              typeof code === "string" &&
              ERROR_CODES.includes(code as ErrorCode),
          )
        )
          return { kind: "retryable" };
        return { kind: "invalid", errors: errors as Partial<Record<keyof EnquiryState, ErrorCode>> };
      }
      if (res.status === 403 && body["error"] === "verification_failed")
        return { kind: "verification" };
      if (res.status === 429 || res.status >= 500) return { kind: "retryable" };
      return { kind: "rejected" };
    } catch {
      return { kind: "retryable" };
    }
  };
  try {
    return await Promise.race([request(), deadline]);
  } finally {
    clearTimeout(timeout);
  }
}

/** Which planner stage holds each field, so the visitor is taken straight to the fix. */
export const FIELD_STAGE: Record<keyof EnquiryState, StageId> = {
  occasions: "occasion",
  scope: "scope",
  services: "scope",
  styles: "style",
  date: "logistics",
  guestCount: "logistics",
  location: "logistics",
  budget: "logistics",
  notes: "logistics",
  name: "contact",
  phone: "contact",
  contactChannel: "contact",
  consent: "contact",
  marketingConsent: "contact",
};

const LABELS: Partial<Record<keyof EnquiryState, string>> = {
  occasions: "occasion",
  services: "services",
  date: "date",
  guestCount: "guest count",
  location: "venue or area",
  notes: "notes",
  name: "name",
  phone: "phone or WhatsApp number",
};

export function fieldMessage(field: keyof EnquiryState, code: ErrorCode): string {
  if (code === "consent_required")
    return "Please agree to us using your details to respond to this enquiry.";
  const label = LABELS[field] ?? "answer";
  if (code === "too_long") return `Your ${label} is a little long — please shorten it.`;
  if (code === "required") return `Please add your ${label}.`;
  if (code === "not_available_for_occasion")
    return "One of the chosen services doesn’t apply to these occasions — please review your services.";
  return `Please check your ${label}.`;
}
