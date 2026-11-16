"""Exercise isolated deployed staging with fictional data. Requires Python 3 and curl."""

import json
import email
import subprocess
import tempfile
import uuid

STAGING = "https://the-wedding-nest-staging.mazharkhan-it.workers.dev"
MAIN = "https://the-wedding-nest.mazharkhan-it.workers.dev"


def request(origin, path, *, method="GET", body=None, headers=None):
    payload = None if body is None else json.dumps(body).encode()
    with tempfile.TemporaryDirectory() as directory:
        header_path = directory + "/headers"
        command = ["curl", "--silent", "--show-error", "--max-time", "30",
                   "--request", method, "--dump-header", header_path,
                   "--write-out", "\n%{http_code}"]
        for name, value in (headers or {}).items():
            command.extend(["--header", name + ": " + value])
        if payload is not None:
            command.extend(["--data-binary", "@-"])
        result = subprocess.run(command + [origin + path], input=payload,
                                capture_output=True, check=True)
        body, status = result.stdout.decode().rsplit("\n", 1)
        with open(header_path, encoding="utf-8") as file:
            raw_headers = file.read().strip().split("\n\n")[-1]
        parsed = email.message_from_string(raw_headers.split("\n", 1)[1])
        return int(status), parsed, body


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
