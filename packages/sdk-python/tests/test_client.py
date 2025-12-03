"""Tests for DevBolt client."""

import tempfile
from pathlib import Path

import pytest

from devbolt import DevBoltClient, EvaluationContext, LogLevel


def test_client_initialization():
    """Test client initialization."""
    # Create temp config
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
        f.write(
            """
test_flag:
  enabled: true
"""
        )
        config_path = f.name

    try:
        client = DevBoltClient(
            config_path=config_path,
            auto_reload=False,
            logger=LogLevel.NONE,
        )

        assert client.is_initialized()
        assert "test_flag" in client.get_all_flags()

        client.destroy()

    finally:
        Path(config_path).unlink()


def test_flag_evaluation():
    """Test flag evaluation."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
        f.write(
            """
simple_flag:
  enabled: true

disabled_flag:
  enabled: false

rollout_flag:
  enabled: true
  rollout:
    percentage: 50
"""
        )
        config_path = f.name

    try:
        client = DevBoltClient(config_path=config_path, auto_reload=False, logger=LogLevel.NONE)

        # Simple enabled flag
        assert client.is_enabled("simple_flag") is True

        # Simple disabled flag
        assert client.is_enabled("disabled_flag") is False

        # Rollout flag (deterministic)
        context = EvaluationContext(user_id="user-123")
        result1 = client.is_enabled("rollout_flag", context)
        result2 = client.is_enabled("rollout_flag", context)
        assert result1 == result2  # Same user gets same result

        client.destroy()

    finally:
        Path(config_path).unlink()


def test_fallback_values():
    """Test fallback values for missing flags."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
        f.write(
            """
existing_flag:
  enabled: true
"""
        )
        config_path = f.name

    try:
        client = DevBoltClient(
            config_path=config_path,
            auto_reload=False,
            logger=LogLevel.NONE,
            fallbacks={"missing_flag": True},
            strict=False,  # Non-strict mode
        )

        # Missing flag returns False in non-strict mode (engine behavior)
        # Fallback is only used when client is not initialized
        assert client.is_enabled("missing_flag") is False

        # Existing flag works normally
        assert client.is_enabled("existing_flag") is True

        client.destroy()

    finally:
        Path(config_path).unlink()
