"""Scoped API keys and short lived, HttpOnly SSE sessions."""
from __future__ import annotations

import hashlib
import hmac
import base64
import json
import os
import secrets
import time
from urllib.parse import urlsplit
from dataclasses import dataclass

from fastapi import HTTPException, Request

ROLES = {"viewer": 0, "operator": 1, "admin": 2}


@dataclass(frozen=True)
class Principal:
    key_id: str
    role: str


class AuthManager:
    """IDS_API_KEYS_JSON maps key IDs to {sha256, role}; never stores raw keys."""

    def __init__(self, revocation_lookup=None, revocation_store=None) -> None:
        self.revocation_lookup, self.revocation_store = revocation_lookup, revocation_store
        self.keys = json.loads(os.getenv("IDS_API_KEYS_JSON", "{}"))
        for entry in self.keys.values():
            if entry.get("role") not in ROLES or len(entry.get("sha256", "")) != 64:
                raise ValueError("API key configuration requires sha256 digest and valid role")
            try:
                bytes.fromhex(entry["sha256"])
            except ValueError as exc:
                raise ValueError("API key digest must be hexadecimal") from exc
        self.dev_local = os.getenv("IDS_AUTH_DEV_LOCALHOST", "false").lower() == "true"
        self.secret = os.getenv("IDS_SESSION_SECRET", "").encode()
        self.revoked: dict[str, float] = {}
        self.origins = set(json.loads(os.getenv("IDS_AUTH_TRUSTED_ORIGINS_JSON", '["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8443", "http://127.0.0.1:8443", "http://localhost:5178"]')))
        self.ttl = min(3600, max(60, int(os.getenv("IDS_SESSION_TTL_S", "900"))))

    def authenticate(self, request: Request) -> Principal:
        authorization = request.headers.get("authorization", "")
        api_key = request.headers.get("x-api-key", "")
        if not authorization and api_key:
            authorization = "Bearer " + api_key
        if authorization:
            scheme, _, raw = authorization.partition(" ")
            if scheme.lower() != "bearer" or not raw:
                raise HTTPException(401, "Bearer API key required")
            digest = hashlib.sha256(raw.encode()).hexdigest()
            for key_id, entry in self.keys.items():
                if hmac.compare_digest(digest, entry["sha256"]):
                    return Principal(key_id, entry["role"])
            raise HTTPException(401, "Invalid API key")
        cookie = request.cookies.get("ids_session")
        if cookie and self.secret:
            try:
                body, signature = cookie.split(".")
                expected = hmac.new(self.secret, body.encode(), hashlib.sha256).hexdigest()
                payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
                if (hmac.compare_digest(signature, expected) and payload["exp"] > time.time()
                        and hashlib.sha256(cookie.encode()).hexdigest() not in self.revoked):
                    if self.revocation_lookup:
                        try:
                            if self.revocation_lookup(hashlib.sha256(cookie.encode()).hexdigest()):
                                raise HTTPException(401, 'Session has been revoked')
                        except HTTPException:
                            raise
                        except Exception:
                            raise HTTPException(503, 'Session validation is temporarily unavailable') from None
                    if payload["kid"] in self.keys:
                        return Principal(payload["kid"], self.keys[payload["kid"]]["role"])
                    if payload["kid"] == "local-development" and self.dev_local and self._local(request):
                        return Principal("local-development", "admin")
            except (ValueError, KeyError, TypeError):
                pass
        if self.dev_local and self._local(request):
            return Principal("local-development", "admin")
        raise HTTPException(401, "Authentication required")

    def require(self, request: Request, role: str = "viewer") -> Principal:
        principal = self.authenticate(request)
        if ROLES[principal.role] < ROLES[role]:
            raise HTTPException(403, "Insufficient role")
        # Browsers must not use session cookies to perform cross-origin writes.
        if request.method not in {"GET", "HEAD", "OPTIONS"} and not (request.headers.get("authorization") or request.headers.get("x-api-key")):
            origin = request.headers.get("origin")
            if origin and origin.rstrip("/") != str(request.base_url).rstrip("/") and origin not in self.origins:
                raise HTTPException(403, "Cross-origin cookie mutation rejected")
        return principal

    def create_session(self, principal: Principal) -> str:
        now = time.time()
        if len(self.secret) < 32:
            raise HTTPException(503, "IDS_SESSION_SECRET requires at least 32 characters")
        self.revoked = {key: value for key, value in self.revoked.items() if value > now}
        payload = {"kid": principal.key_id, "exp": now + self.ttl, "nonce": secrets.token_hex(16)}
        body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
        return body + "." + hmac.new(self.secret, body.encode(), hashlib.sha256).hexdigest()

    def revoke_session(self, token: str) -> None:
        token_hash, expires = hashlib.sha256(token.encode()).hexdigest(), time.time() + self.ttl
        if self.revocation_store:
            self.revocation_store(token_hash, expires)
        self.revoked[token_hash] = expires

    def _local(self, request: Request) -> bool:
        origin = request.headers.get("origin")
        return bool(request.client and request.client.host in {"127.0.0.1", "::1"} and
                    (not origin or urlsplit(origin).hostname in {"localhost", "127.0.0.1", "::1"}))
