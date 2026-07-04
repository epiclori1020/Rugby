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
    ("supabase_secret_key", re.compile(r"sb_secret_[A-Za-z0-9_=-]{12,}")),
    ("openai_project_key", re.compile(r"sk-proj-[A-Za-z0-9_-]{12,}")),
    ("openai_secret_key", re.compile(r"sk-[A-Za-z0-9]{24,}")),
    ("bearer_token", re.compile(r"(?i)bearer\s+[A-Za-z0-9._~+/-]{20,}")),
    ("jwt_like", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("env_assignment", re.compile(r"(?m)^([A-Z][A-Z0-9_]{3,})=(?!true$|false$|0$|1$|development$|production$|test$)[^\s#]{8,}$")),
    ("long_opaque", re.compile(r"\b[A-Za-z0-9_=-]{48,}\b")),
    ("email", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("phone_number", re.compile(r"(?<!\w)(?:\+\d[\d .()/-]{7,}\d|\d{3,}[\s()./-]\d{3,}(?:[\s()./-]\d{2,})?)(?!\w)")),
    ("date_of_birth", re.compile(r"(?i)\b(date of birth|dob|geburtsdatum)\s*[:=]\s*\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b")),
]


MEDICAL_CLEARANCE_PATTERN = re.compile(
    r"(?i)\b(cleared|fit for play|return[- ]?to[- ]?play\s*(freigegeben|clearance|cleared)|diagnose|diagnosis|diagnostik|einsatzfaehig|spielfaehig)\b"
)


@dataclass
class RedactionResult:
    text: str
    redaction_count: int
    medical_flag_count: int


def redact_text(text: str) -> RedactionResult:
    redactions = 0
    current = text
    for _name, pattern in SECRET_PATTERNS:
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
