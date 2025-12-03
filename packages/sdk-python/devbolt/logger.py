"""Logger implementations for DevBolt."""

import json
import sys
from typing import Any, Dict, Optional

from .types import LogLevel, Logger


class NoOpLogger:
    """Logger that does nothing."""

    def debug(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message (no-op)."""
        pass

    def info(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log info message (no-op)."""
        pass

    def warn(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message (no-op)."""
        pass

    def error(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log error message (no-op)."""
        pass


class ConsoleLogger:
    """Console logger with configurable log level."""

    def __init__(self, level: LogLevel = LogLevel.WARN):
        """Initialize console logger.

        Args:
            level: Minimum log level to output
        """
        self.level = level

    def _format_meta(self, meta: Optional[Dict[str, Any]]) -> str:
        """Format metadata for logging."""
        if not meta:
            return ""
        return " " + json.dumps(meta, indent=2)

    def debug(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message."""
        if self.level.value <= LogLevel.DEBUG.value:
            print(f"[DevBolt Debug] {message}{self._format_meta(meta)}", file=sys.stderr)

    def info(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log info message."""
        if self.level.value <= LogLevel.INFO.value:
            print(f"[DevBolt] {message}{self._format_meta(meta)}", file=sys.stderr)

    def warn(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message."""
        if self.level.value <= LogLevel.WARN.value:
            print(f"[DevBolt Warning] {message}{self._format_meta(meta)}", file=sys.stderr)

    def error(self, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """Log error message."""
        if self.level.value <= LogLevel.ERROR.value:
            print(f"[DevBolt Error] {message}{self._format_meta(meta)}", file=sys.stderr)


def create_logger(level: LogLevel = LogLevel.WARN) -> Logger:
    """Create a logger instance.

    Args:
        level: Log level

    Returns:
        Logger instance
    """
    if level == LogLevel.NONE:
        return NoOpLogger()
    return ConsoleLogger(level)
