import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("runs the offline receipt harness with native Node TypeScript resolution", () => {
  const env: NodeJS.ProcessEnv = { ...process.env, TWN_RECEIPT_MODE: "mock" };
  delete env["TWN_RESEND_STAGING_API_KEY"];
  const output = execFileSync(process.execPath, ["scripts/email-receipt-test.mjs"], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    timeout: 10_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  expect(JSON.parse(output)).toEqual({ status: "mock_passed" });
});
