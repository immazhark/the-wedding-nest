/** Manual provider receipt probe. No database, route, schedule or customer input. */
import { sendOperatorEmail } from "./notification-email.ts";

export interface ReceiptTestOptions {
  mode?: string;
  reference?: string;
  createdAt?: string;
  approval?: string;
  domainVerified?: string;
  apiKey?: string;
}

export async function runEmailReceiptTest(
  options: ReceiptTestOptions,
  now: Date,
  network: typeof fetch = fetch,
): Promise<{ status: "mock_passed" | "accepted" | "blocked" | "retry" }> {
  const mode = options.mode ?? "mock";
  if ((mode !== "mock" && mode !== "send") || !options.reference || !options.createdAt) {
    return { status: "blocked" };
  }
  if (
    mode === "send" &&
    (options.approval !== "SEND ONE FICTIONAL RECEIPT" ||
      options.domainVerified !== "true" ||
      !options.apiKey)
  ) {
    return { status: "blocked" };
  }
  const event = {
    id: options.reference,
    purpose: "receipt-test" as const,
    createdAt: options.createdAt,
    notice: {
      enquiryId: options.reference,
      subject: `The Wedding Nest | New enquiry ${options.reference.slice(0, 8).toUpperCase()}`,
      text: [
        "FICTIONAL STAGING RECEIPT TEST — THE WEDDING NEST",
        "No customer enquiry. No booking or response to a customer is required.",
        `Test reference: ${options.reference}`,
        "This checks the email provider path only, not the deployed Worker or database.",
        "Please confirm inbox receipt to the project owner using the test reference.",
      ].join("\n"),
    },
  };
  const mock: typeof fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    if (
      String(_url) !== "https://api.resend.com/emails" ||
      payload.to?.length !== 1 ||
      payload.to[0] !== "theweddingnest.events@gmail.com" ||
      !payload.subject.startsWith("[TEST] ") ||
      !payload.text.startsWith("FICTIONAL STAGING RECEIPT TEST")
    )
      throw new Error("Invalid mock contract");
    return Response.json({ id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" });
  };
  const outcome = await sendOperatorEmail(
    {
      enabled: "true",
      domainVerified: mode === "mock" || options.domainVerified === "true",
      apiKey: mode === "mock" ? "re_fictional_mock_only" : options.apiKey,
    },
    event,
    now,
    mode === "mock" ? mock : network,
  );
  if (outcome.status === "accepted")
    return { status: mode === "mock" ? "mock_passed" : "accepted" };
  return { status: outcome.status };
}
