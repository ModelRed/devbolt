# DevBolt

<div align="center">

[![CI](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml/badge.svg)](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40devbolt%2Fcore.svg)](https://www.npmjs.com/package/@devbolt/core)
[![PyPI version](https://badge.fury.io/py/devbolt.svg)](https://pypi.org/project/devbolt/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Git-native feature flags for developers who hate leaving their terminal**

[Documentation](https://github.com/ModelRed/devbolt) • [Quick Start](#quick-start) • [Examples](#examples) • [Contributing](CONTRIBUTING.md)

</div>

## What is DevBolt?

DevBolt is an open-source, git-native feature flag system that works offline and costs nothing to run. Unlike SaaS solutions that charge $2,000+/month, DevBolt stores flags in your repository alongside your code.

### Why DevBolt?

- 🚀 **10-20x cheaper** than LaunchDarkly/Split.io
- 📝 **Git-native** - Flags live in `.devbolt/flags.yml`
- 🔒 **Works offline** - No vendor lock-in, no network required
- 🎯 **Developer-first** - CLI, SDKs for JS/Python, no UI required
- ⚡ **Production-ready** - Rollouts, targeting, environments

## Quick Start

### JavaScript/TypeScript

```bash
# Install CLI
npm install -g @devbolt/cli

# Initialize
devbolt init

# Install SDK
npm install @devbolt/sdk

# Use it
import { initialize } from '@devbolt/sdk';

const client = initialize();

if (client.isEnabled('new_feature')) {
  // New feature code
}
```

### Python

```bash
pip install devbolt

# In your code
from devbolt import DevBoltClient

client = DevBoltClient()

if client.is_enabled('new_feature'):
    # New feature code
    pass
```

## Features

- ✅ Boolean flags
- ✅ Percentage rollouts (deterministic)
- ✅ User targeting (12 operators)
- ✅ Environment overrides
- ✅ Auto-reload on changes
- ✅ Type-safe APIs

## Documentation

See [github.com/ModelRed/devbolt](https://github.com/ModelRed/devbolt) for full documentation.

## Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](https://github.com/ModelRed/devbolt)
- 💬 [GitHub Discussions](https://github.com/ModelRed/devbolt/discussions)
- 🐛 [Issue Tracker](https://github.com/ModelRed/devbolt/issues)
