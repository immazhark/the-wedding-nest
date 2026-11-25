import assert from "node:assert/strict";
import { test } from "node:test";

// Read-only deployed smoke tests: do not send credentials or follow redirects.
const HOST = "https://the-wedding-nest-staging.mazharkhan-it.workers.dev";
const TEAM = "bitter-cake-e455.cloudflareaccess.com";
const REDIRECT = new Set([302, 303, 307, 308]);

async function probe(path, headers = {}) {
  const response = await fetch(new URL(path, HOST), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers,
  });
  const result = {
    status: response.status,
    location: response.headers.get("location"),
  };
  await response.body?.cancel();
  return result;
}

function assertAccessRedirect(path, response) {
  assert.ok(
    REDIRECT.has(response.status),
    `${path}: expected Access redirect, got ${response.status}`,
  );
  assert.ok(response.location, `${path}: missing redirect location`);
  const target = new URL(response.location, HOST);
  assert.equal(target.protocol, "https:", `${path}: login must use HTTPS`);
  assert.equal(target.hostname, TEAM, `${path}: unexpected login host`);
  assert.ok(target.pathname.startsWith("/cdn-cgi/access/login/"), `${path}: unexpected login path`);
}

test("Access redirects unauthenticated operator entry points and static assets", async () => {
  for (const path of [
    "/operator",
    "/operator/",
    "/operator/operator.js",
    "/operator/operator.css",
    "/api/operator",
    "/api/operator/enquiries",
  ]) {
    assertAccessRedirect(path, await probe(path));
  }
});

test("a forged Access assertion cannot open the operator API", async () => {
  const path = "/api/operator/enquiries/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const response = await probe(path, { "Cf-Access-Jwt-Assertion": "invalid.token.value" });
  if (REDIRECT.has(response.status)) {
    assertAccessRedirect(path, response);
  } else {
    assert.ok([401, 403, 404].includes(response.status), `Unexpected status: ${response.status}`);
  }
});

test("the staging brochure and planner remain public", async () => {
  for (const path of ["/", "/plan-your-event/", "/services/hyderabadi-wedding-catering/"]) {
    const response = await probe(path);
    assert.equal(response.status, 200, `${path}: public route not reachable`);
  }
});
