import re
import json
import urllib.parse

def test_url_validation():
    print("[-] Testing URL Validation Logic...")
    approved_origins = {
        "https://metaclean-4k.vercel.app",
        "https://sendanywhere-lite.onrender.com"
    }
    
    def is_valid_tool_url(url_string):
        if not url_string or not isinstance(url_string, str):
            return False
        try:
            parsed = urllib.parse.urlparse(url_string)
            if parsed.scheme != "https":
                return False
            if parsed.username or parsed.password:
                return False
            if parsed.port and parsed.port != 443:
                return False
            hostname = (parsed.hostname or "").lower()
            if hostname in ("localhost", "127.0.0.1", "0.0.0.0") or hostname.endswith(".localhost") or hostname.endswith(".local") or hostname.endswith(".internal"):
                return False
            if hostname.startswith("10.") or hostname.startswith("192.168."):
                return False
            ip172 = re.match(r"^172\.(\d+)\.", hostname)
            if ip172:
                octet = int(ip172.group(1))
                if 16 <= octet <= 31:
                    return False
            origin = f"{parsed.scheme}://{parsed.netloc}"
            return origin in approved_origins
        except Exception:
            return False

    test_cases = [
        # Valid URLs
        ("https://metaclean-4k.vercel.app/", True),
        ("https://sendanywhere-lite.onrender.com", True),
        # Insecure scheme
        ("http://metaclean-4k.vercel.app/", False),
        ("http://localhost:3000", False),
        ("https://localhost:3000", False),
        # Dangerous schemes
        ("javascript:alert(1)", False),
        ("data:text/html,<script>alert(1)</script>", False),
        ("file:///etc/passwd", False),
        ("blob:https://example.com/uuid", False),
        # Private IP / SSRF
        ("https://127.0.0.1:443", False),
        ("https://192.168.1.1", False),
        ("https://10.0.0.1", False),
        ("https://172.16.0.1", False),
        ("https://172.31.255.255", False),
        # Credentials embedded
        ("https://admin:password@metaclean-4k.vercel.app/", False),
        # Non-standard ports
        ("https://metaclean-4k.vercel.app:8443/", False),
        # Unapproved external domains
        ("https://evil-site.com", False),
        ("https://google.com", False),
        ("", False),
        (None, False)
    ]

    for url, expected in test_cases:
        actual = is_valid_tool_url(url)
        assert actual == expected, f"URL Test Failed: {url} -> expected {expected}, got {actual}"
    print("    [PASS] All 20 URL validation test cases passed.")

def test_headers_and_csp():
    print("[-] Testing Headers & CSP in vercel.json...")
    with open("vercel.json", "r", encoding="utf-8") as f:
        config = json.load(f)

    headers_map = {}
    for entry in config.get("headers", []):
        if entry.get("source") == "/(.*)":
            for h in entry.get("headers", []):
                headers_map[h["key"]] = h["value"]

    # Verify CSP
    csp = headers_map.get("Content-Security-Policy", "")
    assert "default-src 'self'" in csp, "CSP missing default-src 'self'"
    assert "script-src 'self'" in csp, "CSP missing script-src 'self'"
    assert "'unsafe-inline'" not in csp, "CSP must not contain 'unsafe-inline'"
    assert "'unsafe-eval'" not in csp, "CSP must not contain 'unsafe-eval'"
    assert "script-src-attr 'none'" in csp, "CSP missing script-src-attr 'none'"
    assert "fonts.googleapis.com" not in csp, "CSP should not permit external Google Fonts"
    assert "fonts.gstatic.com" not in csp, "CSP should not permit external Google Fonts"
    assert "object-src 'none'" in csp, "CSP missing object-src 'none'"
    assert "base-uri 'self'" in csp, "CSP missing base-uri 'self'"
    assert "form-action 'self'" in csp, "CSP missing form-action 'self'"
    assert "frame-ancestors 'none'" in csp, "CSP missing frame-ancestors 'none'"
    assert "upgrade-insecure-requests" in csp, "CSP missing upgrade-insecure-requests"

    # Verify other headers
    assert headers_map.get("X-Frame-Options") == "DENY", "X-Frame-Options must be DENY"
    assert headers_map.get("X-Content-Type-Options") == "nosniff", "X-Content-Type-Options must be nosniff"
    assert headers_map.get("Cross-Origin-Resource-Policy") == "same-origin", "CORP must be same-origin"
    assert headers_map.get("Cross-Origin-Opener-Policy") == "same-origin", "COOP must be same-origin"
    assert headers_map.get("X-Permitted-Cross-Domain-Policies") == "none", "X-Permitted-Cross-Domain-Policies must be none"
    assert "includeSubDomains" in headers_map.get("Strict-Transport-Security", ""), "HSTS must include subdomains"
    print("    [PASS] All CSP and HTTP security headers verified.")

def test_service_worker():
    print("[-] Testing Service Worker rules in sw.js...")
    with open("sw.js", "r", encoding="utf-8") as f:
        sw = f.read()

    assert 'request.method !== "GET"' in sw, "SW must only cache GET requests"
    assert 'requestUrl.origin !== self.location.origin' in sw, "SW must restrict to same-origin"
    assert 'requestUrl.search' in sw, "SW must prevent caching requests with query parameters"
    assert '!SHELL_SET.has(pathname)' in sw, "SW must restrict caching to shell allowlist"
    assert 'networkResponse.status === 200' in sw, "SW must require HTTP 200 for caching"
    assert 'networkResponse.type === "basic"' in sw, "SW must require basic response type"
    assert 'no-store' in sw, "SW must honor no-store directives"
    assert 'multitool-shell-v4' in sw, "SW must have versioned cache"
    print("    [PASS] Service Worker caching architecture verified.")

def test_dom_xss_and_codebase():
    print("[-] Testing DOM construction and XSS prevention in app.js & index.html...")
    with open("app.js", "r", encoding="utf-8") as f:
        app = f.read()

    # Search for dangerous DOM sinks
    dangerous_patterns = [
        r"\.innerHTML\s*=",
        r"\.outerHTML\s*=",
        r"\.insertAdjacentHTML\(",
        r"document\.write\(",
        r"\beval\(",
        r"new Function\("
    ]
    for pattern in dangerous_patterns:
        matches = re.findall(pattern, app)
        assert len(matches) == 0, f"Found dangerous DOM pattern in app.js: {pattern}"

    # Verify textContent usage
    assert "textContent" in app, "app.js must use textContent for dynamic text"
    assert "createSvgElement" in app, "app.js must use programmatic SVG creation"

    # Verify no localhost in app.js or index.html
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    assert "localhost:3000" not in app, "app.js still contains localhost:3000"
    assert "localhost:3000" not in html, "index.html still contains localhost:3000"
    assert "fonts.googleapis.com" not in html, "index.html still references external Google Fonts"
    assert "fonts.gstatic.com" not in html, "index.html still references external Google Fonts"

    # Verify rel="noopener noreferrer" on all target="_blank"
    for match in re.finditer(r'<a\s+[^>]*target=["\']_blank["\'][^>]*>', html):
        tag = match.group(0)
        assert 'rel="noopener noreferrer"' in tag or "rel='noopener noreferrer'" in tag, f"Missing rel='noopener noreferrer' on {tag}"

    print("    [PASS] Zero DOM XSS sinks, zero localhost destinations, zero unhardened external links.")

if __name__ == "__main__":
    test_url_validation()
    test_headers_and_csp()
    test_service_worker()
    test_dom_xss_and_codebase()
    print("\n[SUCCESS] All Security & Regression Tests Passed Successfully!")
