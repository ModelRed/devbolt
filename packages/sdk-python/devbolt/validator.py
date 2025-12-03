"""Configuration validator for DevBolt."""

import re
from typing import Any, Dict

from .types import (
    TARGETING_OPERATORS,
    FlagConfig,
    FlagsConfig,
    RolloutConfig,
    TargetingRule,
    ValidationError,
)

MAX_FLAG_NAME_LENGTH = 100
MAX_DESCRIPTION_LENGTH = 500
FLAG_NAME_REGEX = re.compile(r"^[a-z0-9_-]+$")


class ConfigValidator:
    """Validates feature flag configurations."""

    @staticmethod
    def validate(config: Any) -> None:
        """Validate entire flags configuration.

        Args:
            config: Configuration to validate

        Raises:
            ValidationError: If configuration is invalid
        """
        if not isinstance(config, dict):
            raise ValidationError("Config must be a dictionary")

        for flag_name, flag_config in config.items():
            ConfigValidator._validate_flag_name(flag_name)
            ConfigValidator._validate_flag_config(flag_name, flag_config)

    @staticmethod
    def _validate_flag_name(name: str) -> None:
        """Validate flag name format."""
        if not isinstance(name, str) or not name:
            raise ValidationError("Flag name must be a non-empty string", "flagName", name)

        if not FLAG_NAME_REGEX.match(name):
            raise ValidationError(
                f"Flag name '{name}' must contain only lowercase letters, numbers, underscores, and hyphens",
                "flagName",
                name,
            )

        if len(name) > MAX_FLAG_NAME_LENGTH:
            raise ValidationError(
                f"Flag name '{name}' exceeds maximum length of {MAX_FLAG_NAME_LENGTH}",
                "flagName",
                name,
            )

    @staticmethod
    def _validate_flag_config(flag_name: str, config: Any) -> None:
        """Validate flag configuration structure."""
        if not isinstance(config, dict):
            raise ValidationError(
                f"Flag '{flag_name}': config must be a dictionary", flag_name, config
            )

        # Validate required 'enabled' field
        if "enabled" not in config or not isinstance(config["enabled"], bool):
            raise ValidationError(
                f"Flag '{flag_name}': 'enabled' must be a boolean",
                f"{flag_name}.enabled",
                config.get("enabled"),
            )

        # Validate optional fields
        if "description" in config:
            ConfigValidator._validate_description(flag_name, config["description"])

        if "rollout" in config:
            ConfigValidator._validate_rollout(flag_name, config["rollout"])

        if "targeting" in config:
            ConfigValidator._validate_targeting(flag_name, config["targeting"])

        if "environments" in config:
            ConfigValidator._validate_environments(flag_name, config["environments"])

        if "metadata" in config:
            ConfigValidator._validate_metadata(flag_name, config["metadata"])

    @staticmethod
    def _validate_description(flag_name: str, description: Any) -> None:
        """Validate description field."""
        if not isinstance(description, str):
            raise ValidationError(
                f"Flag '{flag_name}': description must be a string",
                f"{flag_name}.description",
                description,
            )

        if len(description) > MAX_DESCRIPTION_LENGTH:
            raise ValidationError(
                f"Flag '{flag_name}': description exceeds maximum length of {MAX_DESCRIPTION_LENGTH}",
                f"{flag_name}.description",
                description,
            )

    @staticmethod
    def _validate_rollout(flag_name: str, rollout: Any) -> None:
        """Validate rollout configuration."""
        if not isinstance(rollout, dict):
            raise ValidationError(
                f"Flag '{flag_name}': rollout must be a dictionary",
                f"{flag_name}.rollout",
                rollout,
            )

        percentage = rollout.get("percentage")
        if not isinstance(percentage, (int, float)):
            raise ValidationError(
                f"Flag '{flag_name}': rollout.percentage must be a number",
                f"{flag_name}.rollout.percentage",
                percentage,
            )

        if not (0 <= percentage <= 100):
            raise ValidationError(
                f"Flag '{flag_name}': rollout.percentage must be between 0 and 100",
                f"{flag_name}.rollout.percentage",
                percentage,
            )

        if "seed" in rollout and not isinstance(rollout["seed"], str):
            raise ValidationError(
                f"Flag '{flag_name}': rollout.seed must be a string",
                f"{flag_name}.rollout.seed",
                rollout["seed"],
            )

    @staticmethod
    def _validate_targeting(flag_name: str, targeting: Any) -> None:
        """Validate targeting rules."""
        if not isinstance(targeting, list):
            raise ValidationError(
                f"Flag '{flag_name}': targeting must be a list",
                f"{flag_name}.targeting",
                targeting,
            )

        for index, rule in enumerate(targeting):
            ConfigValidator._validate_targeting_rule(flag_name, rule, index)

    @staticmethod
    def _validate_targeting_rule(flag_name: str, rule: Any, index: int) -> None:
        """Validate single targeting rule."""
        if not isinstance(rule, dict):
            raise ValidationError(
                f"Flag '{flag_name}': targeting rule {index} must be a dictionary",
                f"{flag_name}.targeting[{index}]",
                rule,
            )

        rule_key = f"{flag_name}.targeting[{index}]"

        # Validate attribute
        if (
            "attribute" not in rule
            or not isinstance(rule["attribute"], str)
            or not rule["attribute"]
        ):
            raise ValidationError(
                f"Flag '{flag_name}': targeting rule {index} attribute must be a non-empty string",
                f"{rule_key}.attribute",
                rule.get("attribute"),
            )

        # Validate operator
        if "operator" not in rule or rule["operator"] not in TARGETING_OPERATORS:
            raise ValidationError(
                f"Flag '{flag_name}': targeting rule {index} has invalid operator '{rule.get('operator')}'",
                f"{rule_key}.operator",
                rule.get("operator"),
            )

        operator = rule["operator"]

        # Validate value/values based on operator
        if operator in ("in", "not_in"):
            if "values" not in rule or not isinstance(rule["values"], list) or not rule["values"]:
                raise ValidationError(
                    f"Flag '{flag_name}': targeting rule {index} with operator '{operator}' requires non-empty 'values' list",
                    f"{rule_key}.values",
                    rule.get("values"),
                )
        else:
            if "value" not in rule:
                raise ValidationError(
                    f"Flag '{flag_name}': targeting rule {index} with operator '{operator}' requires 'value' field",
                    f"{rule_key}.value",
                    None,
                )

        # Validate enabled
        if "enabled" not in rule or not isinstance(rule["enabled"], bool):
            raise ValidationError(
                f"Flag '{flag_name}': targeting rule {index} 'enabled' must be a boolean",
                f"{rule_key}.enabled",
                rule.get("enabled"),
            )

        # Validate regex if operator is matches_regex
        if operator == "matches_regex":
            try:
                re.compile(str(rule["value"]))
            except re.error:
                raise ValidationError(
                    f"Flag '{flag_name}': targeting rule {index} has invalid regex pattern",
                    f"{rule_key}.value",
                    rule["value"],
                )

    @staticmethod
    def _validate_environments(flag_name: str, environments: Any) -> None:
        """Validate environments configuration."""
        if not isinstance(environments, dict):
            raise ValidationError(
                f"Flag '{flag_name}': environments must be a dictionary",
                f"{flag_name}.environments",
                environments,
            )

        for env, enabled in environments.items():
            if not isinstance(enabled, bool):
                raise ValidationError(
                    f"Flag '{flag_name}': environment '{env}' value must be a boolean",
                    f"{flag_name}.environments.{env}",
                    enabled,
                )

    @staticmethod
    def _validate_metadata(flag_name: str, metadata: Any) -> None:
        """Validate metadata."""
        if not isinstance(metadata, dict):
            raise ValidationError(
                f"Flag '{flag_name}': metadata must be a dictionary",
                f"{flag_name}.metadata",
                metadata,
            )
