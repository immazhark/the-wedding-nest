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

export async function submitEnquiry(
  enquiry: EnquiryState,
  turnstileToken: string,
  idempotencyKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetchFn("/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({ turnstileToken, enquiry }),
      credentials: "same-origin",
    });
  } catch {
    return { kind: "retryable" };
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    /* non-JSON body: handled by status below */
  }
  if (res.ok) {
    return typeof body["id"] === "string"
      ? { kind: "accepted", id: body["id"] }
      : { kind: "retryable" };
  }
  if (res.status === 422 && body["errors"] && typeof body["errors"] === "object") {
    return {
      kind: "invalid",
      errors: body["errors"] as Partial<Record<keyof EnquiryState, ErrorCode>>,
    };
  }
  if (res.status === 403 && body["error"] === "verification_failed")
    return { kind: "verification" };
  if (res.status === 429 || res.status >= 500) return { kind: "retryable" };
  return { kind: "rejected" };
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
