"""
scripts/lib/github_app_auth.py
================================
Infinity Orchestrator — GitHub App Authentication Helper

Generates short-lived installation access tokens from a GitHub App's
private key (RS256 JWT → exchange → installation token).

Works with the standard stdlib only (no third-party deps required).

Environment variables consumed:
  GH_APP_ID           — numeric App ID  (e.g. "123456")
  GH_APP_PRIVATE_KEY  — full PEM private key (RSA) or path to a .pem file
  GH_APP_INSTALLATION_ID (optional) — pin a specific installation;
                         auto-discovered from the repos list if omitted

Falls back to GH_PAT or GITHUB_TOKEN if App credentials are absent so that
existing workflows keep working during the transition.

Usage:
    from scripts.lib.github_app_auth import get_token, get_headers

    # Get an installation token (string)
    token = get_token()

    # Get pre-built request headers dict
    headers = get_headers()

    # One-liner for urllib requests
    req = Request(url, headers=get_headers())
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import struct
import time
from typing import Optional
from urllib.error import HTTPError
from urllib.request import Request, urlopen

log = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

# ─────────────────────────────────────────────────────────────────────────────
# Pure-stdlib RSA + JWT (no cryptography package required)
# ─────────────────────────────────────────────────────────────────────────────

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _parse_pem_private_key(pem: str) -> tuple[int, int]:
    """
    Parse an RSA PRIVATE KEY PEM (PKCS#1) and return (n, d) — the modulus
    and private exponent needed for RS256 signing.

    Handles both traditional PKCS#1 ("BEGIN RSA PRIVATE KEY") and
    PKCS#8 ("BEGIN PRIVATE KEY") formats.
    """
    lines = [l.strip() for l in pem.strip().splitlines()]
    # Strip header/footer lines
    b64_body = "".join(l for l in lines if not l.startswith("-----"))
    der = base64.b64decode(b64_body)
    return _parse_pkcs1_der(der) if b"RSA PRIVATE KEY" in pem.encode() else _parse_pkcs8_der(der)


def _read_asn1_length(data: bytes, offset: int) -> tuple[int, int]:
    """Return (length, new_offset) from a DER-encoded ASN.1 length field."""
    b = data[offset]
    offset += 1
    if b < 0x80:
        return b, offset
    n_bytes = b & 0x7F
    length = int.from_bytes(data[offset:offset + n_bytes], "big")
    return length, offset + n_bytes


def _read_asn1_integer(data: bytes, offset: int) -> tuple[int, int]:
    """Read an ASN.1 INTEGER and return (value, new_offset)."""
    assert data[offset] == 0x02, f"Expected INTEGER tag at {offset}"
    offset += 1
    length, offset = _read_asn1_length(data, offset)
    value = int.from_bytes(data[offset:offset + length], "big")
    return value, offset + length


def _parse_pkcs1_der(der: bytes) -> tuple[int, int]:
    """Parse PKCS#1 RSAPrivateKey DER → (n, d)."""
    # SEQUENCE { version, n, e, d, p, q, dp, dq, qp }
    assert der[0] == 0x30
    _, offset = _read_asn1_length(der, 1)
    _version, offset = _read_asn1_integer(der, offset)  # version
    n, offset = _read_asn1_integer(der, offset)           # modulus
    _e, offset = _read_asn1_integer(der, offset)          # publicExponent
    d, offset = _read_asn1_integer(der, offset)           # privateExponent
    return n, d


def _parse_pkcs8_der(der: bytes) -> tuple[int, int]:
    """Parse PKCS#8 PrivateKeyInfo DER → (n, d) for RSA keys.

    Structure:
      SEQUENCE {
        INTEGER (version = 0)
        SEQUENCE (AlgorithmIdentifier) { OID rsaEncryption, NULL }
        OCTET STRING { PKCS#1 RSAPrivateKey }
      }
    """
    assert der[0] == 0x30, f"Expected SEQUENCE (0x30) at byte 0, got {hex(der[0])}"
    _, offset = _read_asn1_length(der, 1)
    # Skip version INTEGER
    if der[offset] == 0x02:
        offset += 1
        ver_len, offset = _read_asn1_length(der, offset)
        offset += ver_len
    # Skip AlgorithmIdentifier SEQUENCE
    assert der[offset] == 0x30, f"Expected AlgorithmIdentifier SEQUENCE at {offset}"
    offset += 1
    alg_len, offset = _read_asn1_length(der, offset)
    offset += alg_len
    # OCTET STRING containing PKCS#1
    assert der[offset] == 0x04, f"Expected OCTET STRING at {offset}, got {hex(der[offset])}"
    offset += 1
    inner_len, offset = _read_asn1_length(der, offset)
    pkcs1 = der[offset:offset + inner_len]
    return _parse_pkcs1_der(pkcs1)


def _rsa_sign_pkcs1v15_sha256(message: bytes, n: int, d: int) -> bytes:
    """
    Pure-Python RSA PKCS#1 v1.5 SHA-256 signature.
    SHA256 DER prefix per RFC 3447.
    """
    k = (n.bit_length() + 7) // 8  # key length in bytes
    sha256_prefix = bytes([
        0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01,
        0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20,
    ])
    digest = hashlib.sha256(message).digest()
    T = sha256_prefix + digest
    # EM = 0x00 || 0x01 || PS || 0x00 || T
    ps_len = k - len(T) - 3
    if ps_len < 8:
        raise ValueError("RSA key too short for PKCS#1 v1.5")
    em = bytes([0x00, 0x01]) + bytes([0xFF] * ps_len) + bytes([0x00]) + T
    m = int.from_bytes(em, "big")
    s = pow(m, d, n)
    return s.to_bytes(k, "big")


def _make_jwt(app_id: str, private_key_pem: str) -> str:
    """Mint a GitHub App JWT valid for 60 seconds."""
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {"iat": now - 60, "exp": now + 540, "iss": app_id}

    header_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()

    n, d = _parse_pem_private_key(private_key_pem)
    sig = _rsa_sign_pkcs1v15_sha256(signing_input, n, d)
    return f"{header_b64}.{payload_b64}.{_b64url(sig)}"


# ─────────────────────────────────────────────────────────────────────────────
# GitHub API helpers
# ─────────────────────────────────────────────────────────────────────────────

def _api_get(path: str, token: str) -> dict:
    req = Request(
        f"{GITHUB_API}{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "InfinityOrchestrator-AppAuth/1.0",
        },
    )
    with urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def _api_post(path: str, token: str, body: dict = None) -> dict:
    data = json.dumps(body or {}).encode()
    req = Request(
        f"{GITHUB_API}{path}",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "InfinityOrchestrator-AppAuth/1.0",
        },
        method="POST",
    )
    with urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def _get_installation_id(jwt: str, app_id: str) -> Optional[str]:
    """
    Auto-discover the installation ID for the InfinityXOneSystems org
    or any installation of this App.
    """
    env_id = os.environ.get("GH_APP_INSTALLATION_ID", "").strip()
    if env_id:
        return env_id

    try:
        # Try org installation first
        resp = _api_get("/app/installations", jwt)
        installations = resp if isinstance(resp, list) else resp.get("installations", [])
        for inst in installations:
            account = inst.get("account", {})
            if account.get("login", "").lower() == "infinityxonesystems":
                iid = str(inst["id"])
                log.info("Found installation ID %s for InfinityXOneSystems", iid)
                return iid
        # Fall back to first available installation
        if installations:
            iid = str(installations[0]["id"])
            log.info("Using first available installation ID %s", iid)
            return iid
    except Exception as exc:
        log.warning("Could not auto-discover installation: %s", exc)

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Token cache — reuse within a process lifetime (tokens last 1 hour)
# ─────────────────────────────────────────────────────────────────────────────

_token_cache: Optional[str] = None
_token_expires_at: float = 0.0


def _read_private_key() -> Optional[str]:
    """Read the private key from env var or file path."""
    raw = os.environ.get("GH_APP_PRIVATE_KEY", "").strip()
    if not raw:
        return None
    # If it looks like a file path rather than a PEM string
    if not raw.startswith("-----") and os.path.exists(raw):
        with open(raw) as f:
            return f.read().strip()
    # GitHub Actions stores multi-line secrets with literal \n — normalise
    return raw.replace("\\n", "\n")


def get_token(repos: Optional[list[str]] = None) -> str:
    """
    Return a valid GitHub token, with this priority:
      1. GitHub App installation token (GH_APP_ID + GH_APP_PRIVATE_KEY)
      2. GH_PAT personal access token
      3. GITHUB_TOKEN (Actions default — limited to current repo)

    Args:
        repos: list of "owner/repo" strings to request access to (optional,
               defaults to all repos the App installation has access to).
    """
    global _token_cache, _token_expires_at

    # Return cached token if still valid (with 2-min safety margin)
    if _token_cache and time.time() < _token_expires_at - 120:
        return _token_cache

    app_id = os.environ.get("GH_APP_ID", "").strip()
    private_key = _read_private_key()

    if app_id and private_key:
        try:
            log.info("Authenticating as GitHub App (ID: %s)", app_id)
            jwt = _make_jwt(app_id, private_key)
            installation_id = _get_installation_id(jwt, app_id)
            if not installation_id:
                raise RuntimeError("Could not find App installation")

            path = f"/app/installations/{installation_id}/access_tokens"
            body: dict = {}
            if repos:
                body["repositories"] = [r.split("/")[-1] for r in repos]
                # Also need the owner — use repository_ids if available
            resp = _api_post(path, jwt, body)
            token = resp["token"]
            expires_at = resp.get("expires_at", "")

            # Parse expiry: "2026-03-13T01:00:00Z"
            if expires_at:
                ts = time.mktime(time.strptime(expires_at, "%Y-%m-%dT%H:%M:%SZ"))
                _token_expires_at = ts
            else:
                _token_expires_at = time.time() + 3600

            _token_cache = token
            log.info("✅ GitHub App token obtained (expires %s)", expires_at)
            return token

        except Exception as exc:
            log.warning("GitHub App auth failed: %s — falling back to PAT/GITHUB_TOKEN", exc)

    # Fallback 1: Personal access token
    pat = os.environ.get("GH_PAT", "").strip()
    if pat:
        log.info("Using GH_PAT for GitHub authentication")
        return pat

    # Fallback 2: Actions GITHUB_TOKEN
    default = os.environ.get("GITHUB_TOKEN", "").strip()
    if default:
        log.info("Using GITHUB_TOKEN (limited to current repo)")
        return default

    raise RuntimeError(
        "No GitHub credentials found. Set GH_APP_ID + GH_APP_PRIVATE_KEY, "
        "GH_PAT, or GITHUB_TOKEN."
    )


def get_headers(repos: Optional[list[str]] = None) -> dict:
    """Return pre-built Authorization headers using the best available token."""
    return {
        "Authorization": f"Bearer {get_token(repos)}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "InfinityOrchestrator/1.0",
    }


def print_token() -> None:
    """CLI helper — prints the resolved token to stdout for shell scripts."""
    import sys
    try:
        print(get_token())
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    print_token()
