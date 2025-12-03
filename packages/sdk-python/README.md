# DevBolt Python SDK

Python SDK for DevBolt feature flags.

## Installation

```bash
pip install devbolt
```

## Quick Start

```python
from devbolt import DevBoltClient, EvaluationContext

# Initialize client
client = DevBoltClient()

# Check if flag is enabled
if client.is_enabled("new_feature"):
    print("New feature enabled!")

# With context
context = EvaluationContext(
    user_id="user-123",
    email="john@example.com"
)

if client.is_enabled("premium_features", context):
    print("Premium features enabled!")

# Get detailed evaluation
result = client.evaluate("new_checkout", context)
print(f"Enabled: {result.enabled}")
print(f"Reason: {result.reason}")
```

## Documentation

See main [DevBolt documentation](https://devbolt.com/docs) for details.

## License

MIT
