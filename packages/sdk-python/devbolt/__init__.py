"""DevBolt - Git-native feature flags for developers."""

from .client import DevBoltClient
from .engine import FlagEngine
from .logger import create_logger
from .parser import ConfigParser
from .types import (
    ConfigParseError,
    DevBoltError,
    EvaluationContext,
    EvaluationMetadata,
    EvaluationResult,
    FlagConfig,
    FlagNotFoundError,
    FlagsConfig,
    LogLevel,
    RolloutConfig,
    TargetingRule,
    ValidationError,
)
from .validator import ConfigValidator

__version__ = "0.1.0"

__all__ = [
    # Client
    "DevBoltClient",
    # Engine
    "FlagEngine",
    # Parser
    "ConfigParser",
    # Validator
    "ConfigValidator",
    # Logger
    "create_logger",
    # Types
    "EvaluationContext",
    "EvaluationResult",
    "EvaluationMetadata",
    "FlagConfig",
    "FlagsConfig",
    "RolloutConfig",
    "TargetingRule",
    "LogLevel",
    # Errors
    "DevBoltError",
    "ValidationError",
    "FlagNotFoundError",
    "ConfigParseError",
]
