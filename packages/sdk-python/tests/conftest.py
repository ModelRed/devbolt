"""Pytest configuration and fixtures."""

import tempfile
from pathlib import Path
from typing import Generator

import pytest


@pytest.fixture
def temp_config_file() -> Generator[str, None, None]:
    """Create a temporary config file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
        f.write(
            """
test_flag:
  enabled: true
  description: "Test flag"

disabled_flag:
  enabled: false

rollout_flag:
  enabled: true
  rollout:
    percentage: 50

targeted_flag:
  enabled: true
  targeting:
    - attribute: email
      operator: ends_with
      value: "@company.com"
      enabled: true

env_flag:
  enabled: true
  environments:
    production: false
    staging: true
    development: true
"""
        )
        config_path = f.name

    yield config_path

    # Cleanup
    Path(config_path).unlink(missing_ok=True)


@pytest.fixture
def simple_config_file() -> Generator[str, None, None]:
    """Create a simple config file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yml", delete=False) as f:
        f.write(
            """
simple_flag:
  enabled: true
"""
        )
        config_path = f.name

    yield config_path

    Path(config_path).unlink(missing_ok=True)
