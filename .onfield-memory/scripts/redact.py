#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from dataclasses import dataclass


REDACTION = "[REDACTED]"
FLAGGED = "[FLAGGED_MEDICAL_CLEARANCE_WORDING]"


SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("supabase_service_role", re.compile(r"(?i)(SUPABASE_SERVICE_ROLE(?:_KEY)?|SERVICE_ROLE_KEY)\s*[:=]\s*['\"]?[^'\"\s]+")),
    ("service_role_assignment", re.compile(r"(?i)(service_role[\w\s-]*key?)\s*[:=]\s*['\"]?[A-Za-z0-9._=-]{16,}")),
    ("supabase_key", re.compile(r"sb_(?:publishable|secret)_[A-Za-z0-9_=-]{12,}")),
    ("openai_project_key", re.compile(r"sk-proj-[A-Za-z0-9_-]{12,}")),
    ("openai_secret_key", re.compile(r"sk-[A-Za-z0-9]{24,}")),
    ("bearer_token", re.compile(r"(?i)bearer\s+[A-Za-z0-9._~+/-]{20,}")),
    ("jwt_like", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("url_sensitive_value", re.compile(r"(?i)([?&](?:access_token|refresh_token|api_key|apikey|key|token|code|password|secret)=)[^&#\s]+")),
    ("env_assignment", re.compile(r"(?m)^([A-Z][A-Z0-9_]{3,})=(?!true$|false$|0$|1$|development$|production$|test$)[^\s#]{8,}$")),
    ("prefixed_token", re.compile(r"(?i)\b((?:id|token|session|trace|request|user|auth|ref)[-_:= ]+)[A-Za-z0-9._~+/=-]{16,}\b")),
    ("uuid", re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")),
    ("ipv4", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
    ("ipv6", re.compile(r"\b(?=[A-Fa-f0-9:]*[A-Fa-f])(?=[A-Fa-f0-9:]*:[A-Fa-f0-9:]*:)[A-Fa-f0-9]{0,4}(?::[A-Fa-f0-9]{0,4}){2,7}\b")),
    ("long_opaque", re.compile(r"\b[A-Za-z0-9_=-]{48,}\b")),
    ("email", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("phone_number", re.compile(r"(?<!\w)(?<!\d[\s()./-])(?:\+\d[\d .()/-]{7,}\d|\d{3,}[\s()./-]\d{3,}(?:[\s()./-]\d{2,})?)(?![\w\s()./-]*\d)")),
    ("date_of_birth", re.compile(r"(?i)\b(date of birth|dob|geburtsdatum)\s*[:=]\s*\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b")),
]


CREDIT_CARD_CANDIDATE_PATTERN = re.compile(r"\b(?:\d[ -]?){12,18}\d\b")
CONTROL_CHAR_PATTERN = re.compile(r"[\r\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]")


MEDICAL_CLEARANCE_PATTERN = re.compile(
    r"(?i)\b(cleared|fit for play|return[- ]?to[- ]?play\s*(freigegeben|clearance|cleared)|diagnose|diagnosis|diagnostik|einsatzfaehig|spielfaehig)\b"
)


@dataclass
class RedactionResult:
    text: str
    redaction_count: int
    medical_flag_count: int


def is_luhn_valid(digits: str) -> bool:
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    double = False
    for char in reversed(digits):
        value = int(char)
        if double:
            value *= 2
            if value > 9:
                value -= 9
        total += value
        double = not double
    return total % 10 == 0


def redact_text(text: str) -> RedactionResult:
    redactions = 0
    current = CONTROL_CHAR_PATTERN.sub(" ", text)

    def replace_credit_card(match: re.Match[str]) -> str:
        nonlocal redactions
        digits = re.sub(r"[^0-9]", "", match.group(0))
        if not is_luhn_valid(digits):
            return match.group(0)
        redactions += 1
        return REDACTION

    current = CREDIT_CARD_CANDIDATE_PATTERN.sub(replace_credit_card, current)

    for name, pattern in SECRET_PATTERNS:
        if name in {"url_sensitive_value", "prefixed_token"}:
            current, count = pattern.subn(lambda match: f"{match.group(1)}{REDACTION}", current)
        else:
            current, count = pattern.subn(REDACTION, current)
        redactions += count

    def replace_medical(match: re.Match[str]) -> str:
        return FLAGGED

    current, medical_count = MEDICAL_CLEARANCE_PATTERN.subn(replace_medical, current)
    return RedactionResult(current, redactions, medical_count)


def main() -> int:
    value = sys.stdin.read()
    result = redact_text(value)
    sys.stdout.write(result.text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
