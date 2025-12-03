"""Tests for flag evaluator."""

from devbolt.evaluator import FlagEvaluator
from devbolt.types import EvaluationContext, FlagConfig, TargetingRule


def test_evaluate_simple_enabled():
    """Test simple enabled flag."""
    evaluator = FlagEvaluator()
    config = FlagConfig(enabled=True)
    context = EvaluationContext()

    result = evaluator.evaluate("test_flag", config, context)

    assert result.enabled is True
    assert "enabled for all users" in result.reason.lower()


def test_evaluate_simple_disabled():
    """Test simple disabled flag."""
    evaluator = FlagEvaluator()
    config = FlagConfig(enabled=False)
    context = EvaluationContext()

    result = evaluator.evaluate("test_flag", config, context)

    assert result.enabled is False
    assert "disabled globally" in result.reason.lower()


def test_evaluate_environment_override():
    """Test environment override."""
    evaluator = FlagEvaluator()
    config = FlagConfig(
        enabled=True,
        environments={"production": False, "staging": True},
    )

    # Production environment
    result_prod = evaluator.evaluate(
        "test_flag", config, EvaluationContext(environment="production")
    )
    assert result_prod.enabled is False

    # Staging environment
    result_staging = evaluator.evaluate(
        "test_flag", config, EvaluationContext(environment="staging")
    )
    assert result_staging.enabled is True


def test_evaluate_rollout():
    """Test rollout evaluation."""
    from devbolt.types import RolloutConfig

    evaluator = FlagEvaluator()
    config = FlagConfig(
        enabled=True,
        rollout=RolloutConfig(percentage=50),
    )

    # Same user should get same result
    context = EvaluationContext(user_id="user-123")
    result1 = evaluator.evaluate("test_flag", config, context)
    result2 = evaluator.evaluate("test_flag", config, context)

    assert result1.enabled == result2.enabled


def test_evaluate_targeting_equals():
    """Test targeting with equals operator."""
    evaluator = FlagEvaluator()
    rule = TargetingRule(
        attribute="email",
        operator="equals",
        value="test@example.com",
        enabled=True,
    )
    config = FlagConfig(enabled=True, targeting=[rule])

    # Matching email
    result_match = evaluator.evaluate(
        "test_flag",
        config,
        EvaluationContext(email="test@example.com"),
    )
    assert result_match.enabled is True

    # Non-matching email - falls through to default
    result_no_match = evaluator.evaluate(
        "test_flag",
        config,
        EvaluationContext(email="other@example.com"),
    )
    assert result_no_match.enabled is True  # Falls through to enabled=True


def test_evaluate_targeting_ends_with():
    """Test targeting with ends_with operator."""
    evaluator = FlagEvaluator()
    rule = TargetingRule(
        attribute="email",
        operator="ends_with",
        value="@company.com",
        enabled=True,
    )
    config = FlagConfig(enabled=True, targeting=[rule])

    result = evaluator.evaluate(
        "test_flag",
        config,
        EvaluationContext(email="john@company.com"),
    )
    assert result.enabled is True


def test_evaluate_priority():
    """Test evaluation priority order."""
    evaluator = FlagEvaluator()

    # Environment override beats everything
    config = FlagConfig(
        enabled=True,
        environments={"production": False},
        rollout={"percentage": 100},
    )

    result = evaluator.evaluate(
        "test_flag",
        config,
        EvaluationContext(environment="production", user_id="user-123"),
    )
    assert result.enabled is False
    assert "environment override" in result.reason.lower()
