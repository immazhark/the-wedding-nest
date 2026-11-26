import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { handleOperatorApi, type OperatorD1 } from "../../src/worker/operator-api";

const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CREATED = "2026-11-25T09:00:00.000Z";
const NOW = "2026-11-26T10:00:00.000Z";

it("executes operator audit transactions through isolated workerd D1", async () => {
  // Dedicated generated config: no real account ID, credentials, remote bindings or persistence.
  const directory = await mkdtemp(join(tmpdir(), "twn-d1-audit-"));
  try {
    const configPath = join(directory, "wrangler.json");
    await writeFile(
      configPath,
      JSON.stringify({
        name: "twn-local-audit-test",
        compatibility_date: "2026-11-01",
        d1_databases: [
          {
            binding: "DB",
            database_name: "local-audit-test",
            database_id: "00000000-0000-4000-8000-000000000001",
            remote: false,
          },
        ],
      }),
    );
    const platform = await getPlatformProxy<{ DB: OperatorD1 }>({
      configPath,
      persist: false,
      remoteBindings: false,
    });
    try {
      const db = platform.env.DB;
      // These three migrations contain no trigger bodies or semicolons in literals.
      // Apply their actual statements, not a test-only facsimile of the schema.
      for (const migration of [
        "0001_enquiries.sql",
        "0003_unsuccessful_retention.sql",
        "0005_operator_audit.sql",
      ]) {
        const source = await readFile(`migrations/${migration}`, "utf8");
        const statements = source
          .replace(/^--.*$/gm, "")
          .split(";")
          .map((statement) => statement.trim())
          .filter(Boolean);
        await db.batch(statements.map((statement) => db.prepare(statement)));
      }
      await db
        .prepare(
          "INSERT INTO enquiries (id, idempotency_key, created_at, payload_json, consent_at) " +
            "VALUES (?1, ?1, ?2, '{}', ?2)",
        )
        .bind(ID, CREATED)
        .run();

      const change = (from: string, to: string) =>
        handleOperatorApi(
          new Request(`https://twn.test/api/operator/enquiries/${ID}/status`, {
            method: "POST",
            headers: { origin: "https://twn.test", "content-type": "application/json" },
            body: JSON.stringify({ from, to }),
          }),
          { db, operator: "fixture@example.invalid", now: () => NOW, log: () => {} },
        );
      expect((await change("new", "contacted")).status).toBe(200);
      expect((await change("new", "booked")).status).toBe(409);
      expect(await db.prepare("SELECT COUNT(*) AS c FROM operator_audit").first()).toEqual({
        c: 1,
      });
      await db.prepare("DROP TABLE operator_audit").run();
      expect((await change("contacted", "unsuccessful")).status).toBe(503);
      expect(await db.prepare("SELECT status, unsuccessful_at FROM enquiries").first()).toEqual({
        status: "contacted",
        unsuccessful_at: null,
      });
    } finally {
      await platform.dispose();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
