"""Hash utilities for deterministic rollout distribution."""

import hashlib
from typing import Optional


class Hasher:
    """Deterministic hash function for rollout distribution."""

    DEFAULT_SEED = "devbolt"

    @staticmethod
    def get_bucket(flag_name: str, identifier: str, seed: Optional[str] = None) -> int:
        """Generate consistent hash bucket (0-99) for identifier.

        Args:
            flag_name: Name of the flag
            identifier: User identifier
            seed: Optional custom seed

        Returns:
            Bucket number (0-99)
        """
        hash_input = f"{seed or Hasher.DEFAULT_SEED}:{flag_name}:{identifier}"
        hash_digest = hashlib.sha256(hash_input.encode()).hexdigest()

        # Convert first 8 hex characters to number
        hash_number = int(hash_digest[:8], 16)

        # Return bucket 0-99
        return hash_number % 100

    @staticmethod
    def is_in_rollout(
        flag_name: str, identifier: str, percentage: float, seed: Optional[str] = None
    ) -> bool:
        """Check if identifier is in rollout percentage.

        Args:
            flag_name: Name of the flag
            identifier: User identifier
            percentage: Rollout percentage (0-100)
            seed: Optional custom seed

        Returns:
            True if in rollout, False otherwise
        """
        if percentage == 0:
            return False
        if percentage == 100:
            return True

        bucket = Hasher.get_bucket(flag_name, identifier, seed)
        return bucket < percentage
