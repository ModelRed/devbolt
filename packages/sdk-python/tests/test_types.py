"""Tests for type definitions."""

import pytest

from devbolt.types import (
    RolloutConfig,
    TargetingRule,
    ValidationError,
)


def test_rollout_config_valid():
    """Test valid rollout config."""
    config = RolloutConfig(percentage=50)
    assert config.percentage == 50
    assert config.seed is None

    config_with_seed = RolloutConfig(percentage=75, seed="custom")
    assert config_with_seed.seed == "custom"


def test_rollout_config_invalid_percentage():
    """Test invalid rollout percentage."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        RolloutConfig(percentage=-1)

    with pytest.raises(ValueError, match="between 0 and 100"):
        RolloutConfig(percentage=101)


def test_targeting_rule_valid():
    """Test valid targeting rule."""
    rule = TargetingRule(
        attribute="email",
        operator="equals",
        value="test@example.com",
        enabled=True,
    )
    assert rule.attribute == "email"
    assert rule.operator == "equals"


def test_targeting_rule_requires_value():
    """Test targeting rule requires value for non-in operators."""
    with pytest.raises(ValueError, match="requires 'value'"):
        TargetingRule(
            attribute="email",
            operator="equals",
            enabled=True,
        )


def test_targeting_rule_requires_values_for_in():
    """Test targeting rule requires values for in operator."""
    with pytest.raises(ValueError, match="requires 'values'"):
        TargetingRule(
            attribute="userId",
            operator="in",
            enabled=True,
        )


def test_targeting_rule_invalid_operator():
    """Test invalid operator."""
    with pytest.raises(ValueError, match="Invalid operator"):
        TargetingRule(
            attribute="email",
            operator="invalid_op",  # type: ignore
            value="test",
            enabled=True,
        )
