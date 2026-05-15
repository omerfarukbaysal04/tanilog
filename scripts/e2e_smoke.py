import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request


API_URL = os.getenv("TANILOG_API_URL", "http://localhost:8000/api/v1")
WEB_URL = os.getenv("TANILOG_WEB_URL", "http://localhost:3000")


def api(path, method="GET", body=None, token=None, content_type="application/json"):
    data = None
    headers = {}
    if body is not None:
        data = body if isinstance(body, bytes) else json.dumps(body).encode("utf-8")
        headers["Content-Type"] = content_type
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{API_URL}{path}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(request, timeout=10) as response:
        raw = response.read().decode("utf-8")
        return response.status, json.loads(raw) if raw else None


def web(path):
    with urllib.request.urlopen(f"{WEB_URL}{path}", timeout=10) as response:
        html = response.read().decode("utf-8")
        assert response.status == 200
        assert "Tan" in html


def main():
    for path in ["/", "/privacy", "/terms", "/kvkk", "/dashboard", "/billing"]:
        web(path)

    email = f"e2e{int(time.time())}@example.com"
    password = "Test12345"
    api("/auth/register", "POST", {
        "email": email,
        "password": password,
        "full_name": "E2E Smoke",
        "accepted_terms": True,
    })

    form = urllib.parse.urlencode({"username": email, "password": password}).encode("utf-8")
    _, token_payload = api("/auth/login", "POST", form, content_type="application/x-www-form-urlencoded")
    token = token_payload["access_token"]

    _, settings = api("/settings", token=token)
    assert settings["ai_use_health_records"] is True

    _, plans = api("/billing/plans", token=token)
    assert "monthly" in plans["plans"]

    _, dashboard = api("/dashboard/summary", token=token)
    assert len(dashboard["trends"]) == 7

    api("/settings/account", "DELETE", {"password": password, "confirmation": "HESABIMI SIL"}, token=token)
    print("E2E smoke passed")


if __name__ == "__main__":
    main()
