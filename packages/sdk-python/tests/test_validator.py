"""Tests for configuration validator."""

import pytest

from devbolt.types import ValidationError
from devbolt.validator import ConfigValidator


def test_validate_empty_config():
    """Test empty config is valid."""
    ConfigValidator.validate({})


def test_validate_simple_flag():
    """Test simple valid flag."""
    config = {
        "test_flag": {
            "enabled": True,
            "description": "Test flag",
        }
    }
    ConfigValidator.validate(config)


def test_validate_rejects_non_dict():
    """Test validator rejects non-dict config."""
    with pytest.raises(ValidationError, match="must be a dictionary"):
        ConfigValidator.validate([])

    with pytest.raises(ValidationError, match="must be a dictionary"):
        ConfigValidator.validate("string")


def test_validate_flag_name():
    """Test flag name validation."""
    # Valid names
    valid_names = ["test_flag", "test-flag", "test123", "a"]
    for name in valid_names:
        config = {name: {"enabled": True}}
        ConfigValidator.validate(config)

    # Invalid names
    with pytest.raises(ValidationError, match="lowercase"):
        ConfigValidator.validate({"InvalidFlag": {"enabled": True}})

    with pytest.raises(ValidationError, match="lowercase"):
        ConfigValidator.validate({"flag with spaces": {"enabled": True}})

    with pytest.raises(ValidationError):
        ConfigValidator.validate({"": {"enabled": True}})


def test_validate_enabled_required():
    """Test enabled field is required."""
    with pytest.raises(ValidationError, match="must be a boolean"):
        ConfigValidator.validate({"test_flag": {}})

    with pytest.raises(ValidationError, match="must be a boolean"):
        ConfigValidator.validate({"test_flag": {"enabled": "yes"}})


def test_validate_rollout():
    """Test rollout validation."""
    # Valid rollout
    config = {
        "test_flag": {
            "enabled": True,
            "rollout": {"percentage": 50},
        }
    }
    ConfigValidator.validate(config)

    # Invalid percentage
    with pytest.raises(ValidationError, match="between 0 and 100"):
        ConfigValidator.validate(
            {
                "test_flag": {
                    "enabled": True,
                    "rollout": {"percentage": 101},
                }
            }
        )


def test_validate_targeting():
    """Test targeting validation."""
    # Valid targeting
    config = {
        "test_flag": {
            "enabled": True,
            "targeting": [
                {
                    "attribute": "email",
                    "operator": "equals",
                    "value": "test@example.com",
                    "enabled": True,
                }
            ],
        }
    }
    ConfigValidator.validate(config)

    # Invalid operator
    with pytest.raises(ValidationError, match="invalid operator"):
        ConfigValidator.validate(
            {
                "test_flag": {
                    "enabled": True,
                    "targeting": [
                        {
                            "attribute": "email",
                            "operator": "invalid",
                            "value": "test",
                            "enabled": True,
                        }
                    ],
                }
            }
        )


def test_validate_environments():
    """Test environments validation."""
    # Valid
    config = {
        "test_flag": {
            "enabled": True,
            "environments": {
                "production": False,
                "staging": True,
            },
        }
    }
    ConfigValidator.validate(config)

    # Invalid value
    with pytest.raises(ValidationError, match="must be a boolean"):
        ConfigValidator.validate(
            {
                "test_flag": {
                    "enabled": True,
                    "environments": {"production": "false"},
                }
            }
        )
