/**
 * OWNER-ONLY CONTENT CONTRACT. Not a transport, schedule, endpoint or approval.
 *
 * When a future authorised dispatcher is built, adapters may convert this
 * plain-text body to their delivery format. Never interpolate customer content
 * into HTML, headers, URLs or logs; never send without an approved recipient.
 */
import { summarise } from "../lib/enquiry/summary";
import { validateEnquiry } from "../lib/enquiry/validate";

export interface OperatorNotice {
  enquiryId: string;
  subject: string;
  /** Contains private contact information. Do not log, publish or cache. */
  text: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Prevent user supplied CR/LF, bidi and HTML-like delimiters becoming markup/headers. */
const safeLine = (value: string): string =>
  value
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .trim();

/**
 * Render from server-validated enquiry data; not from a browser/client.
 * No side effects: caller must provide its own owner-approved transport.
 */
export function buildOperatorNotice(enquiryId: string, storedEnquiry: unknown): OperatorNotice {
  if (!UUID.test(enquiryId)) throw new Error("Invalid enquiry reference");
  const result = validateEnquiry(storedEnquiry);
  if (!result.ok) throw new Error("Invalid stored enquiry");

  const reference = enquiryId.toLowerCase();
  const rows = summarise(result.value);
  return {
    enquiryId: reference,
    // Never use private names, untrusted text, phone or dates in a transport subject.
    subject: `The Wedding Nest | New enquiry ${reference.slice(0, 8).toUpperCase()}`,
    text: [
      "The Wedding Nest — Internal event enquiry",
      `Reference: ${reference}`,
      "",
      ...rows.map((row) => `${row.label}: ${safeLine(row.value)}`),
      "",
      "Private customer information. For the authorised enquiry team only.",
    ].join("\n"),
  };
}
