"""Exercise the isolated deployed Worker using fictional data only (no dependencies)."""

import json
import urllib.error
import urllib.request
import uuid

STAGING = "https://the-wedding-nest-staging.mazharkhan-it.workers.dev"
MAIN = "https://the-wedding-nest.mazharkhan-it.workers.dev"


def request(origin, path, *, method="GET", body=None, headers=None):
    payload = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        origin + path, data=payload, method=method, headers=headers or {}
    )
    try:
        response = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read().decode()


def main():
    status, _, body = request(MAIN, "/api/enquiry", method="POST", body={})
    assert status == 503 and json.loads(body)["error"] == "enquiries_disabled"
    status, headers, body = request(STAGING, "/robots.txt")
    assert status == 200 and "Disallow: /" in body
    assert "noindex" in headers.get("X-Robots-Tag", "")
    status, _, body = request(STAGING, "/plan-your-event/")
    assert status == 200 and "Use fictional details only" in body
    assert "Test environment" in body

    key = str(uuid.uuid4())
    headers = {
        "Content-Type": "application/json",
        "Origin": STAGING,
        "Idempotency-Key": key,
    }
    enquiry = {
        "occasions": ["nikah"], "scope": "full-planning", "services": [],
        "styles": [], "date": {"kind": "undecided"}, "guestCount": "200",
        "location": "", "budget": "discuss", "notes": "Synthetic staging verification",
        "name": "Synthetic QA Person", "phone": "+12025550100",
        "contactChannel": "whatsapp", "consent": True, "marketingConsent": False,
    }
    payload = {"turnstileToken": "XXXX.DUMMY.TOKEN.XXXX", "enquiry": enquiry}
    status, _, _ = request(STAGING, "/api/enquiry")
    assert status == 405
    status, _, _ = request(STAGING, "/api/enquiry", method="POST", body=payload)
    assert status == 403
    status, _, _ = request(
        STAGING, "/api/enquiry", method="POST", body=payload,
        headers={**headers, "Origin": "https://untrusted.example"},
    )
    assert status == 403
    status, _, _ = request(
        STAGING, "/api/enquiry", method="POST",
        body={**payload, "turnstileToken": ""}, headers=headers,
    )
    assert status == 403
    status, _, _ = request(
        STAGING, "/api/enquiry", method="POST",
        body={**payload, "enquiry": {**enquiry, "consent": False}}, headers=headers,
    )
    assert status == 422
    status, response_headers, body = request(
        STAGING, "/api/enquiry", method="POST", body=payload, headers=headers
    )
    assert status == 201, (status, body)
    assert response_headers.get("Cache-Control") == "no-store"
    reference = json.loads(body)["id"]
    status, _, body = request(
        STAGING, "/api/enquiry", method="POST", body=payload, headers=headers
    )
    assert status == 200 and json.loads(body)["id"] == reference
    print("PASS: main intake disabled; staging noindex/test notice; method, origin, "
          "verification and consent guards; durable submission and idempotent retry.")
    print("Synthetic enquiry reference:", reference)


if __name__ == "__main__":
    main()
