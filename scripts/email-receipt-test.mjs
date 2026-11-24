// Node 24 native TypeScript stripping. No compiler, added dependency or secret output.
import { randomUUID } from "node:crypto";
import { runEmailReceiptTest } from "../src/worker/email-receipt-test.ts";

const mode = process.env.TWN_RECEIPT_MODE ?? "mock";
try {
  const result = await runEmailReceiptTest(
    {
      mode,
      reference: process.env.TWN_RECEIPT_REFERENCE || (mode === "mock" ? randomUUID() : ""),
      createdAt:
        process.env.TWN_RECEIPT_CREATED_AT || (mode === "mock" ? new Date().toISOString() : ""),
      approval: process.env.TWN_RECEIPT_APPROVAL ?? "",
      domainVerified: process.env.TWN_RECEIPT_DOMAIN_VERIFIED ?? "",
      // Mock mode never reads the sending secret.
      apiKey: mode === "send" ? (process.env.TWN_RESEND_STAGING_API_KEY ?? "") : "",
    },
    new Date(),
  );
  console.log(JSON.stringify(result));
  if (result.status !== "mock_passed" && result.status !== "accepted") process.exitCode = 1;
} catch {
  console.error('{"status":"blocked"}');
  process.exitCode = 1;
}
