# DevBolt CLI

Command-line interface for managing DevBolt feature flags.

## Installation

```bash
npm install -g @devbolt/cli
```

## Usage

```bash
# Initialize DevBolt
devbolt init

# Create a flag
devbolt create my_feature

# List all flags
devbolt list

# Show flag details
devbolt show my_feature

# Toggle flag
devbolt toggle my_feature

# Set rollout
devbolt rollout my_feature 50

# Check flag status
devbolt status my_feature --user-id user-123

# Remove flag
devbolt remove old_feature

# Validate config
devbolt validate
```

## Documentation

See main [DevBolt documentation](https://github.com/ModelRed/devbolt) for details.

## License

MIT
