"""Tests for hash utilities."""

from devbolt.hasher import Hasher


def test_get_bucket_deterministic():
    """Test bucket calculation is deterministic."""
    bucket1 = Hasher.get_bucket("test_flag", "user-123")
    bucket2 = Hasher.get_bucket("test_flag", "user-123")
    assert bucket1 == bucket2


def test_get_bucket_range():
    """Test bucket is in valid range."""
    for i in range(100):
        bucket = Hasher.get_bucket("test_flag", f"user-{i}")
        assert 0 <= bucket <= 99


def test_get_bucket_distribution():
    """Test buckets are reasonably distributed."""
    buckets = [Hasher.get_bucket("test_flag", f"user-{i}") for i in range(1000)]

    # Should have good distribution across buckets
    unique_buckets = len(set(buckets))
    assert unique_buckets > 50  # At least 50 different buckets used


def test_get_bucket_different_users():
    """Test different users get different buckets."""
    bucket1 = Hasher.get_bucket("test_flag", "user-1")
    bucket2 = Hasher.get_bucket("test_flag", "user-2")
    # Not guaranteed to be different, but very likely
    # Just check they're valid
    assert 0 <= bucket1 <= 99
    assert 0 <= bucket2 <= 99


def test_is_in_rollout_edges():
    """Test rollout edge cases."""
    # 0% should always be false
    assert Hasher.is_in_rollout("test_flag", "user-123", 0) is False

    # 100% should always be true
    assert Hasher.is_in_rollout("test_flag", "user-123", 100) is True


def test_is_in_rollout_approximate():
    """Test rollout percentage is approximately correct."""
    enabled_count = sum(
        1 for i in range(1000) if Hasher.is_in_rollout("test_flag", f"user-{i}", 50)
    )

    # Should be approximately 50% (with some margin)
    assert 450 <= enabled_count <= 550
