import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request


BASE_URL = os.getenv("TANILOG_API_URL", "http://localhost:8000/api/v1")


def request(path, method="GET", body=None, token=None, content_type="application/json"):
    data = None
    headers = {}
    if body is not None:
        data = body if isinstance(body, bytes) else json.dumps(body).encode("utf-8")
        headers["Content-Type"] = content_type
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        raw = response.read().decode("utf-8")
        return response.status, json.loads(raw) if raw else None


def expect_http_error(path, expected_status):
    try:
        request(path)
    except urllib.error.HTTPError as error:
        assert error.code == expected_status, f"expected {expected_status}, got {error.code}"
        return
    raise AssertionError(f"expected HTTP {expected_status} for {path}")


def main():
    suffix = int(time.time())
    email = f"smoke{suffix}@example.com"
    password = "Test12345"

    expect_http_error("/dashboard/summary", 401)

    status, user = request(
        "/auth/register",
        method="POST",
        body={
            "email": email,
            "password": password,
            "full_name": "Smoke Test",
            "accepted_terms": True,
        },
    )
    assert status == 201
    assert user["email"] == email

    login_body = urllib.parse.urlencode({"username": email, "password": password}).encode("utf-8")
    _, token_payload = request(
        "/auth/login",
        method="POST",
        body=login_body,
        content_type="application/x-www-form-urlencoded",
    )
    token = token_payload["access_token"]

    _, settings = request("/settings", token=token)
    assert settings["notifications_enabled"] is True

    _, dashboard = request("/dashboard/summary", token=token)
    assert len(dashboard["trends"]) == 7
    assert "data_quality" in dashboard

    _, search = request("/search?q=smoke", token=token)
    assert "results" in search

    _, timeline = request("/timeline?days=7", token=token)
    assert "items" in timeline

    _, onboarding = request("/onboarding", token=token)
    assert onboarding["total_count"] == 5

    _, risks = request("/risk-alerts", token=token)
    assert isinstance(risks, list)

    _, push_config = request("/push/config", token=token)
    assert push_config["provider"] == "web_push"

    _, notifications = request("/notifications", token=token)
    assert isinstance(notifications, list)

    _, export = request("/settings/export", token=token)
    assert export["user"]["email"] == email

    try:
        request("/admin/overview", token=token)
    except urllib.error.HTTPError as error:
        assert error.code == 403
    else:
        raise AssertionError("non-admin user should not access admin overview")

    request(
        "/settings/account",
        method="DELETE",
        body={"password": password, "confirmation": "HESABIMI SIL"},
        token=token,
    )

    print("Backend smoke API passed")


if __name__ == "__main__":
    main()
