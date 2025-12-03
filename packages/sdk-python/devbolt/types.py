"""Type definitions for DevBolt feature flags."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Protocol, Union

# Targeting operators
TargetingOperator = Literal[
    "equals",
    "not_equals",
    "in",
    "not_in",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "matches_regex",
]

TARGETING_OPERATORS: List[TargetingOperator] = [
    "equals",
    "not_equals",
    "in",
    "not_in",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "matches_regex",
]


class LogLevel(Enum):
    """Log levels for the logger."""

    DEBUG = 0
    INFO = 1
    WARN = 2
    ERROR = 3
    NONE = 4


class Logger(Protocol):
    """Logger interface for dependency injection."""

    def debug(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message."""
        ...

    def info(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log info message."""
        ...

    def warn(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message."""
        ...

    def error(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log error message."""
        ...


@dataclass
class RolloutConfig:
    """Rollout configuration for percentage-based distribution."""

    percentage: float
    seed: Optional[str] = None

    def __post_init__(self) -> None:
        """Validate rollout configuration."""
        if not 0 <= self.percentage <= 100:
            raise ValueError("Rollout percentage must be between 0 and 100")


@dataclass
class TargetingRule:
    """Targeting rule for conditional flag evaluation."""

    attribute: str
    operator: TargetingOperator
    enabled: bool
    value: Optional[Union[str, int, float, bool]] = None
    values: Optional[List[Union[str, int, float, bool]]] = None
    description: Optional[str] = None

    def __post_init__(self) -> None:
        """Validate targeting rule."""
        if self.operator not in TARGETING_OPERATORS:
            raise ValueError(f"Invalid operator: {self.operator}")

        if self.operator in ("in", "not_in"):
            if not self.values:
                raise ValueError(f"Operator '{self.operator}' requires 'values'")
        else:
            if self.value is None:
                raise ValueError(f"Operator '{self.operator}' requires 'value'")


@dataclass
class FlagConfig:
    """Feature flag configuration."""

    enabled: bool
    description: Optional[str] = None
    rollout: Optional[RolloutConfig] = None
    targeting: Optional[List[TargetingRule]] = None
    environments: Optional[Dict[str, bool]] = None
    metadata: Optional[Dict[str, Any]] = None


FlagsConfig = Dict[str, FlagConfig]


@dataclass
class EvaluationContext:
    """Context for flag evaluation."""

    user_id: Optional[str] = None
    email: Optional[str] = None
    environment: Optional[str] = None
    custom_attributes: Optional[Dict[str, Union[str, int, float, bool]]] = None
    _hash_seed: Optional[str] = None  # Internal testing use only


@dataclass
class EvaluationMetadata:
    """Metadata about flag evaluation."""

    timestamp: float
    matched_rule: Optional[int] = None
    rollout_bucket: Optional[int] = None
    variant: Optional[str] = None


@dataclass
class EvaluationResult:
    """Result of flag evaluation."""

    flag_name: str
    enabled: bool
    reason: str
    metadata: EvaluationMetadata


# Exceptions


class DevBoltError(Exception):
    """Base exception for DevBolt errors."""

    def __init__(self, message: str, code: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}


class ValidationError(DevBoltError):
    """Configuration validation error."""

    def __init__(self, message: str, field: Optional[str] = None, value: Any = None):
        super().__init__(message, "VALIDATION_ERROR", {"field": field, "value": value})
        self.field = field
        self.value = value


class FlagNotFoundError(DevBoltError):
    """Flag not found error."""

    def __init__(self, flag_name: str):
        super().__init__(
            f"Flag '{flag_name}' not found", "FLAG_NOT_FOUND", {"flag_name": flag_name}
        )
        self.flag_name = flag_name


class ConfigParseError(DevBoltError):
    """Config parsing error."""

    def __init__(self, message: str, cause: Optional[Exception] = None):
        details = {"cause": str(cause)} if cause else {}
        super().__init__(message, "CONFIG_PARSE_ERROR", details)
