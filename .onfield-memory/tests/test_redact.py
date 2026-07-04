#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from redact import FLAGGED, REDACTION, redact_text


def test_secret_redaction() -> None:
    service_key_name = "SUPABASE" + "_SERVICE_ROLE_KEY"
    supabase_secret = "sb" + "_secret_" + "abcdefghijklmnopqrstuvwxyz"
    openai_secret = "sk" + "-proj-" + "abcdefghijklmnopqrstuvwxyz123456"
    bearer = "Bearer " + "abcdefghijklmnopqrstuvwxyz1234567890"
    text = "\n".join(
        [
            f"{service_key_name}={supabase_secret}",
            f"OPENAI_API_KEY={openai_secret}",
            f"Authorization: {bearer}",
            "Normal OnField workflow context remains.",
        ]
    )
    result = redact_text(text)
    assert "sb" + "_secret_" not in result.text
    assert "sk" + "-proj-" not in result.text
    assert "Bearer abc" not in result.text
    assert REDACTION in result.text
    assert "Normal OnField workflow context remains." in result.text
    assert result.redaction_count >= 3


def test_medical_clearance_flag() -> None:
    result = redact_text("Player is " + "cleared" + " for return-to-play clearance.")
    assert "cleared" not in result.text.lower()
    assert FLAGGED in result.text
    assert result.medical_flag_count >= 1


def test_basic_pii_redaction() -> None:
    email = "player" + "@example.com"
    phone = "+43 660 1234567"
    result = redact_text(f"Contact {email} or {phone}.")
    assert email not in result.text
    assert phone not in result.text
    assert result.redaction_count >= 2


if __name__ == "__main__":
    test_secret_redaction()
    test_medical_clearance_flag()
    test_basic_pii_redaction()
    print("test_redact.py PASS")
