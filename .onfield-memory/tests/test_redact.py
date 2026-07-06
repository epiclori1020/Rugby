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


def test_luvi_inspired_runtime_identifiers_are_redacted() -> None:
    uuid = "123e4567-e89b-12d3-a456-426614174000"
    ip = "192.168.1.24"
    token_value = "abcdef0123456789abcdef0123456789"
    url_key = "https://example.test/callback?access_token=" + token_value
    text = "\n".join(
        [
            f"request_id={uuid}",
            f"client_ip={ip}",
            f"session:{token_value}",
            url_key,
        ]
    )
    result = redact_text(text)
    assert uuid not in result.text
    assert ip not in result.text
    assert token_value not in result.text
    assert "access_token=" in result.text
    assert result.redaction_count >= 4


def test_credit_card_luhn_redaction_is_targeted() -> None:
    valid_test_card = "4111 1111 1111 1111"
    invalid_long_digits = "1234 5678 9012 3456"
    result = redact_text(f"payment {valid_test_card}; neutral digits {invalid_long_digits}")
    assert valid_test_card not in result.text
    assert invalid_long_digits in result.text
    assert result.redaction_count == 1


def test_control_characters_are_neutralized_without_erasing_context() -> None:
    result = redact_text("OnField\x00 workflow\r\ncontext remains.")
    assert "\x00" not in result.text
    assert "\r" not in result.text
    assert "OnField" in result.text
    assert "context remains." in result.text


def test_neutral_onfield_context_stays_readable() -> None:
    text = "OnField Runtime Memory should keep compact workflow notes readable."
    result = redact_text(text)
    assert result.text == text
    assert result.redaction_count == 0


if __name__ == "__main__":
    test_secret_redaction()
    test_medical_clearance_flag()
    test_basic_pii_redaction()
    test_luvi_inspired_runtime_identifiers_are_redacted()
    test_credit_card_luhn_redaction_is_targeted()
    test_control_characters_are_neutralized_without_erasing_context()
    test_neutral_onfield_context_stays_readable()
    print("test_redact.py PASS")
