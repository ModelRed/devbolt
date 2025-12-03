"""DevBolt SDK client for feature flag evaluation."""

import time
from pathlib import Path
from typing import TYPE_CHECKING, Callable, Dict, Optional, Union

from watchdog.events import FileSystemEvent, FileSystemEventHandler


if TYPE_CHECKING:
    from watchdog.observers import Observer as ObserverType
else:
    from watchdog.observers import Observer as ObserverType

from .engine import FlagEngine
from .logger import create_logger
from .parser import ConfigParser
from .types import (
    ConfigParseError,
    EvaluationContext,
    EvaluationResult,
    EvaluationMetadata,
    FlagsConfig,
    LogLevel,
    Logger,
)


class ConfigFileHandler(FileSystemEventHandler):
    """File system event handler for config changes."""

    def __init__(self, config_path: str, on_change: Callable[[], None]) -> None:
        """Initialize handler.

        Args:
            config_path: Path to config file
            on_change: Callback when file changes
        """
        self.config_path = config_path
        self.on_change = on_change
        self._last_modified = 0.0

    def on_modified(self, event: FileSystemEvent) -> None:
        """Handle file modification event."""
        if event.src_path == self.config_path:
            # Debounce rapid changes
            current_time = time.time()
            if current_time - self._last_modified > 0.1:
                self._last_modified = current_time
                self.on_change()


class DevBoltClient:
    """DevBolt SDK client for feature flag evaluation."""

    DEFAULT_LOCATIONS = [
        ".devbolt/flags.yml",
        ".devbolt/flags.yaml",
        "devbolt.yml",
        "devbolt.yaml",
        ".devbolt.yml",
        ".devbolt.yaml",
    ]

    def __init__(
        self,
        config_path: Optional[str] = None,
        auto_reload: bool = True,
        default_context: Optional[EvaluationContext] = None,
        logger: Optional[Union[Logger, LogLevel]] = None,
        throw_on_error: bool = False,
        strict: bool = False,
        fallbacks: Optional[Dict[str, bool]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
        on_config_update: Optional[Callable[[FlagsConfig], None]] = None,
        on_flag_evaluated: Optional[Callable[[EvaluationResult, EvaluationContext], None]] = None,
    ) -> None:
        """Initialize DevBolt client.

        Args:
            config_path: Path to config file (auto-detected if not provided)
            auto_reload: Enable automatic reload on config changes
            default_context: Default context for all evaluations
            logger: Logger instance or log level
            throw_on_error: Throw exceptions instead of using fallbacks
            strict: Enable strict mode
            fallbacks: Fallback values for flags
            on_error: Error callback
            on_config_update: Config update callback
            on_flag_evaluated: Flag evaluation callback
        """
        # Setup logger
        self.logger = self._create_logger(logger)

        # Setup options
        self.auto_reload = auto_reload
        self.default_context = default_context or EvaluationContext()
        self.throw_on_error = throw_on_error
        self.strict = strict
        self.fallbacks = fallbacks or {}
        self.on_error = on_error or self._default_error_handler
        self.on_config_update = on_config_update or (lambda _: None)
        self.on_flag_evaluated = on_flag_evaluated or (lambda _, __: None)

        # State
        self._initialized = False
        self._error_count = 0
        self._last_load_time = 0.0
        self._observer: Optional[ObserverType] = None
        self._engine: Optional[FlagEngine] = None

        # Find and load config
        try:
            self.config_path = self._find_config_path(config_path)
            self._load_config()
            self._initialized = True

            # Setup file watcher
            if self.auto_reload:
                self._setup_file_watcher()

            self.logger.info(
                "DevBolt client initialized",
                {
                    "config_path": self.config_path,
                    "auto_reload": self.auto_reload,
                    "strict": self.strict,
                },
            )

        except Exception as e:
            self._handle_error(e)
            if self.throw_on_error:
                raise

    def _create_logger(self, logger: Optional[Union[Logger, LogLevel]]) -> Logger:
        """Create logger instance."""
        if logger is None:
            return create_logger(LogLevel.WARN)
        if isinstance(logger, LogLevel):
            return create_logger(logger)
        return logger

    def _default_error_handler(self, error: Exception) -> None:
        """Default error handler."""
        self.logger.error(f"DevBolt error: {str(error)}")
        self._error_count += 1

    def _find_config_path(self, custom_path: Optional[str]) -> str:
        """Find config file path."""
        if custom_path:
            path = Path(custom_path)
            if not path.exists():
                raise ConfigParseError(f"Config file not found: {custom_path}")
            return str(path.absolute())

        # Search default locations
        for location in self.DEFAULT_LOCATIONS:
            path = Path(location)
            if path.exists():
                self.logger.debug(f"Found config file at: {location}")
                return str(path.absolute())

        searched = "\n  - ".join(self.DEFAULT_LOCATIONS)
        raise ConfigParseError(
            f"DevBolt config file not found. Run 'devbolt init' or specify config_path.\n\n"
            f"Searched locations:\n  - {searched}"
        )

    def _load_config(self) -> None:
        """Load configuration from file."""
        try:
            self.logger.debug(f"Loading config from: {self.config_path}")
            config = ConfigParser.parse_file(self.config_path)

            self._engine = FlagEngine(
                config,
                logger=self.logger,
                strict=self.strict,
            )

            self._last_load_time = time.time()
            self._error_count = 0

            self.logger.info(
                "Config loaded successfully",
                {"flag_count": len(config), "path": self.config_path},
            )

        except Exception as e:
            self.logger.error(f"Failed to load config: {str(e)}")
            raise

    def _setup_file_watcher(self) -> None:
        """Setup file watcher for auto-reload."""
        try:
            from watchdog.observers import Observer

            event_handler = ConfigFileHandler(self.config_path, self._reload_config)

            self._observer = Observer()
            watch_dir = str(Path(self.config_path).parent)
            self._observer.schedule(event_handler, watch_dir, recursive=False)
            self._observer.start()

            self.logger.debug("File watcher started")

        except Exception as e:
            self.logger.warn(f"Failed to setup file watcher: {str(e)}")

    def _reload_config(self) -> None:
        """Reload configuration from file."""
        try:
            self.logger.info(f"Config file changed, reloading: {self.config_path}")
            config = ConfigParser.parse_file(self.config_path)

            if self._engine:
                self._engine.update_config(config)
            else:
                self._engine = FlagEngine(config, logger=self.logger, strict=self.strict)

            self._last_load_time = time.time()
            self._error_count = 0

            self.on_config_update(config)
            self.logger.info("Config reloaded successfully")

        except Exception as e:
            self._handle_error(e)

    def _handle_error(self, error: Exception) -> None:
        """Handle errors based on options."""
        self.on_error(error)
        if self.throw_on_error:
            raise error

    def is_initialized(self) -> bool:
        """Check if client is initialized.

        Returns:
            True if initialized, False otherwise
        """
        return self._initialized and self._engine is not None

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
        """
        # Check initialization
        if not self.is_initialized():
            fallback = self.fallbacks.get(flag_name, False)
            return EvaluationResult(
                flag_name=flag_name,
                enabled=fallback,
                reason="Client not initialized, using fallback",
                metadata=EvaluationMetadata(timestamp=time.time()),
            )

        # Merge contexts
        merged_context = EvaluationContext(
            user_id=context.user_id if context else self.default_context.user_id,
            email=context.email if context else self.default_context.email,
            environment=context.environment if context else self.default_context.environment,
            custom_attributes={
                **(self.default_context.custom_attributes or {}),
                **(context.custom_attributes if context and context.custom_attributes else {}),
            },
        )

        try:
            result = self._engine.evaluate(flag_name, merged_context)

            # Trigger callback
            try:
                self.on_flag_evaluated(result, merged_context)
            except Exception as e:
                self.logger.error(f"Error in on_flag_evaluated callback: {str(e)}")

            return result

        except Exception as e:
            self._handle_error(e)

            # Return fallback
            fallback = self.fallbacks.get(flag_name, False)
            return EvaluationResult(
                flag_name=flag_name,
                enabled=fallback,
                reason=f"Error evaluating flag: {str(e)}",
                metadata=EvaluationMetadata(timestamp=time.time()),
            )

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
        if not self.is_initialized():
            return []
        return self._engine.get_all_flags()

    def get_flag_config(self, flag_name: str) -> Optional[FlagsConfig]:
        """Get flag configuration.

        Args:
            flag_name: Name of the flag

        Returns:
            FlagConfig if found, None otherwise
        """
        if not self.is_initialized():
            return None
        return self._engine.get_flag_config(flag_name)

    def get_config(self) -> FlagsConfig:
        """Get entire configuration.

        Returns:
            Flags configuration
        """
        if not self.is_initialized():
            return {}
        return self._engine.get_config()

    def reload(self) -> None:
        """Manually reload configuration."""
        self.logger.info("Manual config reload triggered")
        self._reload_config()

    def destroy(self) -> None:
        """Destroy client and cleanup resources."""
        self.logger.info("Destroying DevBolt client")

        if self._observer:
            self._observer.stop()
            self._observer.join()
            self._observer = None

        self._engine = None
        self._initialized = False
