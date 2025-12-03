"""Flag evaluator for DevBolt."""

import re
import time
from typing import Optional, Union

from .hasher import Hasher
from .logger import NoOpLogger
from .types import (
    EvaluationContext,
    EvaluationMetadata,
    EvaluationResult,
    FlagConfig,
    Logger,
    TargetingRule,
)


class FlagEvaluator:
    """Evaluates feature flags based on configuration and context."""

    def __init__(self, logger: Optional[Logger] = None):
        """Initialize evaluator.

        Args:
            logger: Optional logger instance
        """
        self.logger = logger or NoOpLogger()

    def evaluate(
        self, flag_name: str, config: FlagConfig, context: EvaluationContext
    ) -> EvaluationResult:
        """Evaluate a feature flag.

        Args:
            flag_name: Name of the flag
            config: Flag configuration
            context: Evaluation context

        Returns:
            EvaluationResult with enabled status and reason
        """
        start_time = time.time()
        self.logger.debug(f"Evaluating flag '{flag_name}'", {"context": context.__dict__})

        # Priority 1: Environment override
        env_result = self._evaluate_environment(flag_name, config, context)
        if env_result:
            return self._create_result(flag_name, env_result[0], env_result[1], start_time)

        # Priority 2: Global disabled
        if not config.enabled:
            return self._create_result(flag_name, False, "Flag is disabled globally", start_time)

        # Priority 3: Targeting rules
        targeting_result = self._evaluate_targeting(flag_name, config, context)
        if targeting_result:
            return self._create_result(
                flag_name,
                targeting_result[0],
                targeting_result[1],
                start_time,
                matched_rule=targeting_result[2],
            )

        # Priority 4: Rollout percentage
        rollout_result = self._evaluate_rollout(flag_name, config, context)
        if rollout_result:
            return self._create_result(
                flag_name,
                rollout_result[0],
                rollout_result[1],
                start_time,
                rollout_bucket=rollout_result[2],
            )

        # Default: enabled for all
        return self._create_result(flag_name, True, "Flag is enabled for all users", start_time)

    def _evaluate_environment(
        self, flag_name: str, config: FlagConfig, context: EvaluationContext
    ) -> Optional[tuple[bool, str]]:
        """Evaluate environment-specific override."""
        if not config.environments or not context.environment:
            return None

        env_enabled = config.environments.get(context.environment)
        if env_enabled is None:
            return None

        self.logger.debug(
            f"Flag '{flag_name}' environment override: {context.environment} = {env_enabled}"
        )

        return (env_enabled, f"Environment override: {context.environment}")

    def _evaluate_targeting(
        self, flag_name: str, config: FlagConfig, context: EvaluationContext
    ) -> Optional[tuple[bool, str, int]]:
        """Evaluate targeting rules."""
        if not config.targeting:
            return None

        for index, rule in enumerate(config.targeting):
            if self._rule_matches(rule, context):
                self.logger.debug(f"Flag '{flag_name}' matched targeting rule #{index + 1}")

                reason = f"Matched targeting rule #{index + 1}"
                if rule.description:
                    reason += f": {rule.description}"

                return (rule.enabled, reason, index)

        return None

    def _rule_matches(self, rule: TargetingRule, context: EvaluationContext) -> bool:
        """Check if a targeting rule matches the context."""
        attribute_value = self._get_attribute_value(rule.attribute, context)

        # If attribute doesn't exist, rule doesn't match
        if attribute_value is None:
            return False

        try:
            operator = rule.operator

            if operator == "equals":
                return attribute_value == rule.value

            elif operator == "not_equals":
                return attribute_value != rule.value

            elif operator == "in":
                return rule.values is not None and attribute_value in rule.values

            elif operator == "not_in":
                return rule.values is None or attribute_value not in rule.values

            elif operator == "contains":
                return str(rule.value).lower() in str(attribute_value).lower()

            elif operator == "not_contains":
                return str(rule.value).lower() not in str(attribute_value).lower()

            elif operator == "starts_with":
                return str(attribute_value).lower().startswith(str(rule.value).lower())

            elif operator == "ends_with":
                return str(attribute_value).lower().endswith(str(rule.value).lower())

            elif operator == "greater_than":
                return float(attribute_value) > float(rule.value)  # type: ignore

            elif operator == "less_than":
                return float(attribute_value) < float(rule.value)  # type: ignore

            elif operator == "greater_than_or_equal":
                return float(attribute_value) >= float(rule.value)  # type: ignore

            elif operator == "less_than_or_equal":
                return float(attribute_value) <= float(rule.value)  # type: ignore

            elif operator == "matches_regex":
                pattern = re.compile(str(rule.value))
                return pattern.search(str(attribute_value)) is not None

            else:
                self.logger.warn(f"Unknown operator: {operator}")
                return False

        except Exception as e:
            self.logger.error(f"Error evaluating rule", {"rule": rule.__dict__, "error": str(e)})
            return False

    def _get_attribute_value(
        self, attribute: str, context: EvaluationContext
    ) -> Optional[Union[str, int, float, bool]]:
        """Get attribute value from context."""
        # Check standard fields
        if attribute == "userId":
            return context.user_id
        if attribute == "email":
            return context.email
        if attribute == "environment":
            return context.environment

        # Check custom attributes
        if context.custom_attributes:
            return context.custom_attributes.get(attribute)

        return None

    def _evaluate_rollout(
        self, flag_name: str, config: FlagConfig, context: EvaluationContext
    ) -> Optional[tuple[bool, str, int]]:
        """Evaluate rollout percentage."""
        if not config.rollout:
            return None

        identifier = context.user_id or context.email or "anonymous"
        seed = config.rollout.seed or context._hash_seed
        bucket = Hasher.get_bucket(flag_name, identifier, seed)
        in_rollout = bucket < config.rollout.percentage

        self.logger.debug(
            f"Flag '{flag_name}' rollout evaluation",
            {
                "percentage": config.rollout.percentage,
                "bucket": bucket,
                "in_rollout": in_rollout,
            },
        )

        return (
            in_rollout,
            f"Rollout {config.rollout.percentage}% (user bucket: {bucket})",
            bucket,
        )

    def _create_result(
        self,
        flag_name: str,
        enabled: bool,
        reason: str,
        start_time: float,
        matched_rule: Optional[int] = None,
        rollout_bucket: Optional[int] = None,
    ) -> EvaluationResult:
        """Create evaluation result."""
        metadata = EvaluationMetadata(
            timestamp=start_time,
            matched_rule=matched_rule,
            rollout_bucket=rollout_bucket,
        )

        result = EvaluationResult(
            flag_name=flag_name,
            enabled=enabled,
            reason=reason,
            metadata=metadata,
        )

        self.logger.debug(
            f"Flag '{flag_name}' evaluation complete",
            {
                "enabled": enabled,
                "reason": reason,
                "duration": time.time() - start_time,
            },
        )

        return result
