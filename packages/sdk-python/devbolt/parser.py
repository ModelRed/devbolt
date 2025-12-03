"""Configuration parser for DevBolt."""

from pathlib import Path
from typing import Any, Dict

import yaml

from .types import (
    ConfigParseError,
    FlagConfig,
    FlagsConfig,
    RolloutConfig,
    TargetingRule,
)
from .validator import ConfigValidator


class ConfigParser:
    """Parses and validates feature flag configurations."""

    @staticmethod
    def parse_yaml(content: str) -> FlagsConfig:
        """Parse YAML string into config.

        Args:
            content: YAML content as string

        Returns:
            Validated flags configuration

        Raises:
            ConfigParseError: If parsing fails
            ValidationError: If validation fails
        """
        try:
            parsed = yaml.safe_load(content)

            if not isinstance(parsed, dict):
                raise ConfigParseError("Config must be a YAML object")

            ConfigValidator.validate(parsed)
            return ConfigParser._convert_to_dataclasses(parsed)

        except yaml.YAMLError as e:
            raise ConfigParseError(f"Failed to parse YAML: {str(e)}", e)
        except Exception as e:
            if isinstance(e, ConfigParseError):
                raise
            raise ConfigParseError(f"Failed to parse config: {str(e)}", e)

    @staticmethod
    def parse_file(file_path: str) -> FlagsConfig:
        """Parse config from file.

        Args:
            file_path: Path to config file

        Returns:
            Validated flags configuration

        Raises:
            ConfigParseError: If parsing fails
        """
        try:
            path = Path(file_path)
            content = path.read_text(encoding="utf-8")
            return ConfigParser.parse_yaml(content)

        except FileNotFoundError:
            raise ConfigParseError(f"Config file not found: {file_path}")
        except Exception as e:
            if isinstance(e, ConfigParseError):
                raise
            raise ConfigParseError(f"Failed to read config file: {str(e)}", e)

    @staticmethod
    def _convert_to_dataclasses(parsed: Dict[str, Any]) -> FlagsConfig:
        """Convert parsed dict to dataclass instances."""
        config: FlagsConfig = {}

        for flag_name, flag_data in parsed.items():

            rollout = None
            if "rollout" in flag_data and flag_data["rollout"]:
                rollout_data = flag_data["rollout"]

                if isinstance(rollout_data, RolloutConfig):
                    rollout = rollout_data
                elif isinstance(rollout_data, dict):
                    rollout = RolloutConfig(
                        percentage=rollout_data["percentage"],
                        seed=rollout_data.get("seed"),
                    )

            targeting = None
            if "targeting" in flag_data and flag_data["targeting"]:
                targeting = []
                for rule in flag_data["targeting"]:

                    if isinstance(rule, TargetingRule):
                        targeting.append(rule)
                    elif isinstance(rule, dict):
                        targeting.append(
                            TargetingRule(
                                attribute=rule["attribute"],
                                operator=rule["operator"],
                                enabled=rule["enabled"],
                                value=rule.get("value"),
                                values=rule.get("values"),
                                description=rule.get("description"),
                            )
                        )

            # Create flag config
            config[flag_name] = FlagConfig(
                enabled=flag_data["enabled"],
                description=flag_data.get("description"),
                rollout=rollout,
                targeting=targeting,
                environments=flag_data.get("environments"),
                metadata=flag_data.get("metadata"),
            )

        return config
