"""Main engine for feature flag evaluation."""

import time
from typing import Optional

from .evaluator import FlagEvaluator
from .logger import NoOpLogger
from .parser import ConfigParser
from .types import (
    EvaluationContext,
    EvaluationResult,
    EvaluationMetadata,
    FlagConfig,
    FlagNotFoundError,
    FlagsConfig,
    Logger,
)


class FlagEngine:
    """Main engine for feature flag evaluation."""

    def __init__(
        self,
        config: FlagsConfig,
        logger: Optional[Logger] = None,
        strict: bool = False,
    ):
        """Initialize flag engine.

        Args:
            config: Flags configuration
            logger: Optional logger instance
            strict: Enable strict mode (throw on missing flags)
        """
        self._config = config
        self.logger = logger or NoOpLogger()
        self.strict = strict
        self.evaluator = FlagEvaluator(self.logger)

        self.logger.info(
            "FlagEngine initialized",
            {
                "flag_count": len(config),
                "strict": strict,
            },
        )

    @classmethod
    def from_yaml(
        cls,
        yaml_content: str,
        logger: Optional[Logger] = None,
        strict: bool = False,
    ) -> "FlagEngine":
        """Create engine from YAML string.

        Args:
            yaml_content: YAML configuration content
            logger: Optional logger instance
            strict: Enable strict mode

        Returns:
            FlagEngine instance
        """
        config = ConfigParser.parse_yaml(yaml_content)
        return cls(config, logger=logger, strict=strict)

    @classmethod
    def from_file(
        cls,
        file_path: str,
        logger: Optional[Logger] = None,
        strict: bool = False,
    ) -> "FlagEngine":
        """Create engine from file.

        Args:
            file_path: Path to config file
            logger: Optional logger instance
            strict: Enable strict mode

        Returns:
            FlagEngine instance
        """
        config = ConfigParser.parse_file(file_path)
        return cls(config, logger=logger, strict=strict)

    def evaluate(
        self,
        flag_name: str,
        context: Optional[EvaluationContext] = None,
    ) -> EvaluationResult:
        """Evaluate a feature flag.

        Args:
            flag_name: Name of the flag
            context: Optional evaluation context

        Returns:
            EvaluationResult

        Raises:
            FlagNotFoundError: If flag not found and strict mode enabled
        """
        flag_config = self._config.get(flag_name)

        if not flag_config:
            if self.strict:
                raise FlagNotFoundError(flag_name)

            self.logger.warn(f"Flag '{flag_name}' not found, returning disabled")
            return EvaluationResult(
                flag_name=flag_name,
                enabled=False,
                reason="Flag not found",
                metadata=EvaluationMetadata(timestamp=time.time()),
            )

        eval_context = context or EvaluationContext()
        return self.evaluator.evaluate(flag_name, flag_config, eval_context)

    def is_enabled(
        self,
        flag_name: str,
        context: Optional[EvaluationContext] = None,
    ) -> bool:
        """Check if a flag is enabled.

        Args:
            flag_name: Name of the flag
            context: Optional evaluation context

        Returns:
            True if enabled, False otherwise
        """
        return self.evaluate(flag_name, context).enabled

    def get_all_flags(self) -> list[str]:
        """Get all flag names.

        Returns:
            List of flag names
        """
        return list(self._config.keys())

    def get_flag_config(self, flag_name: str) -> Optional[FlagConfig]:
        """Get flag configuration.

        Args:
            flag_name: Name of the flag

        Returns:
            FlagConfig if found, None otherwise
        """
        return self._config.get(flag_name)

    def get_config(self) -> FlagsConfig:
        """Get entire configuration.

        Returns:
            Copy of flags configuration
        """
        return self._config.copy()

    def update_config(self, config: FlagsConfig) -> None:
        """Update configuration (for hot reloading).

        Args:
            config: New flags configuration
        """
        self._config = config
        self.logger.info(
            "Configuration updated",
            {"flag_count": len(config)},
        )
