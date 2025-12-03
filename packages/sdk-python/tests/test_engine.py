"""Tests for flag engine."""

import pytest

from devbolt.engine import FlagEngine
from devbolt.types import EvaluationContext, FlagNotFoundError


def test_engine_from_yaml():
    """Test creating engine from YAML."""
    yaml_content = """
test_flag:
  enabled: true
"""
    engine = FlagEngine.from_yaml(yaml_content)
    assert "test_flag" in engine.get_all_flags()


def test_engine_from_file(simple_config_file):
    """Test creating engine from file."""
    engine = FlagEngine.from_file(simple_config_file)
    assert engine.is_enabled("simple_flag") is True


def test_engine_evaluate(simple_config_file):
    """Test flag evaluation."""
    engine = FlagEngine.from_file(simple_config_file)
    result = engine.evaluate("simple_flag")

    assert result.enabled is True
    assert result.flag_name == "simple_flag"
    assert result.metadata is not None


def test_engine_is_enabled(simple_config_file):
    """Test is_enabled convenience method."""
    engine = FlagEngine.from_file(simple_config_file)
    assert engine.is_enabled("simple_flag") is True


def test_engine_flag_not_found():
    """Test missing flag behavior."""
    yaml_content = """
test_flag:
  enabled: true
"""
    engine = FlagEngine.from_yaml(yaml_content)

    # Non-strict mode returns disabled
    result = engine.evaluate("missing_flag")
    assert result.enabled is False
    assert "not found" in result.reason.lower()


def test_engine_flag_not_found_strict():
    """Test missing flag in strict mode."""
    yaml_content = """
test_flag:
  enabled: true
"""
    engine = FlagEngine.from_yaml(yaml_content, strict=True)

    with pytest.raises(FlagNotFoundError):
        engine.evaluate("missing_flag")


def test_engine_get_all_flags(temp_config_file):
    """Test getting all flag names."""
    engine = FlagEngine.from_file(temp_config_file)
    flags = engine.get_all_flags()

    assert "test_flag" in flags
    assert "disabled_flag" in flags
    assert "rollout_flag" in flags


def test_engine_get_flag_config(temp_config_file):
    """Test getting specific flag config."""
    engine = FlagEngine.from_file(temp_config_file)
    config = engine.get_flag_config("test_flag")

    assert config is not None
    assert config.enabled is True


def test_engine_update_config():
    """Test updating configuration."""
    yaml_content = """
test_flag:
  enabled: false
"""
    engine = FlagEngine.from_yaml(yaml_content)
    assert engine.is_enabled("test_flag") is False

    # Update config
    new_yaml = """
test_flag:
  enabled: true
"""
    from devbolt.parser import ConfigParser

    new_config = ConfigParser.parse_yaml(new_yaml)
    engine.update_config(new_config)

    assert engine.is_enabled("test_flag") is True
