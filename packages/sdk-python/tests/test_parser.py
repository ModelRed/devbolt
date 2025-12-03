"""Tests for configuration parser."""

import pytest

from devbolt.parser import ConfigParser
from devbolt.types import ConfigParseError


def test_parse_yaml_simple():
    """Test parsing simple YAML."""
    yaml_content = """
test_flag:
  enabled: true
  description: "Test flag"
"""
    config = ConfigParser.parse_yaml(yaml_content)

    assert "test_flag" in config
    assert config["test_flag"].enabled is True
    assert config["test_flag"].description == "Test flag"


def test_parse_yaml_invalid():
    """Test parsing invalid YAML."""
    with pytest.raises(ConfigParseError):
        ConfigParser.parse_yaml("invalid: yaml: content:")


def test_parse_yaml_not_object():
    """Test parsing non-object YAML."""
    with pytest.raises(ConfigParseError, match="must be a YAML object"):
        ConfigParser.parse_yaml("[]")


def test_parse_file(simple_config_file):
    """Test parsing from file."""
    config = ConfigParser.parse_file(simple_config_file)
    assert "simple_flag" in config


def test_parse_file_not_found():
    """Test parsing non-existent file."""
    with pytest.raises(ConfigParseError, match="not found"):
        ConfigParser.parse_file("/nonexistent/path.yml")


def test_parse_complex_config():
    """Test parsing complex configuration."""
    yaml_content = """
complex_flag:
  enabled: true
  description: "Complex flag"
  rollout:
    percentage: 50
    seed: "custom"
  targeting:
    - attribute: email
      operator: ends_with
      value: "@company.com"
      enabled: true
      description: "Company employees"
  environments:
    production: false
    staging: true
  metadata:
    owner: "platform-team"
    jira: "PROJ-123"
"""
    config = ConfigParser.parse_yaml(yaml_content)
    flag = config["complex_flag"]

    assert flag.rollout is not None
    assert flag.rollout.percentage == 50
    assert flag.rollout.seed == "custom"

    assert flag.targeting is not None
    assert len(flag.targeting) == 1
    assert flag.targeting[0].operator == "ends_with"

    assert flag.environments is not None
    assert flag.environments["production"] is False

    assert flag.metadata is not None
    assert flag.metadata["owner"] == "platform-team"
