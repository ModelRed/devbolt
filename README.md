# DevBolt

<div align="center">

[![CI](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml/badge.svg)](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](#)
[![Downloads](https://img.shields.io/npm/dm/%40devbolt%2Fcore.svg)](https://www.npmjs.com/package/@devbolt/core)
[![Stars](https://img.shields.io/github/stars/ModelRed/devbolt.svg)](https://github.com/ModelRed/devbolt)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<strong>Git native feature flags for developers who hate leaving their terminal</strong>

[Documentation](https://github.com/ModelRed/devbolt) • [Quick Start](#quick-start) • [Examples](#examples) • [Contributing](CONTRIBUTING.md)

</div>

---

## What is DevBolt

DevBolt is an open source git native feature flag system designed for developers who want full control without paying enterprise SaaS prices. All flags live inside your repository and are versioned alongside your code.

No servers.  
No dashboards.  
No surprise invoices.  
Some would even say it is free 🤫

Perfect for solo builders, startups, and teams that want predictable behavior in dev, CI, and production.

---

## Why DevBolt

- 💸 10 to 20 times cheaper than LaunchDarkly or Split.io (represented here by several cash signs 💵💵💵)
- 📝 Git native flags stored in `.devbolt/flags.yml`
- 🔒 Offline friendly works everywhere including air gapped environments
- 🧰 Developer first with CLI and SDKs for JavaScript, TypeScript, and Python
- 🎛️ Rollouts, targeting rules, and environments
- ⚡ Fast deterministic hashing and no network calls

DevBolt gives you the control of a hosted feature flag service without the monthly pain.

---

## How It Works Diagram

```
           ┌─────────────────────────┐
           │     Your Repository     │
           │   .devbolt/flags.yml    │
           └────────────┬────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │    DevBolt CLI  │
               │ devbolt commands │
               └───────┬─────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   DevBolt SDK (JS)   │
            │   DevBolt SDK (Py)   │
            └─────────┬────────────┘
                      │
                      ▼
           ┌─────────────────────────┐
           │  Your Application Code  │
           └─────────────────────────┘
```

Simple predictable and fully local.

---

## Quick Start

### JavaScript and TypeScript

```bash
npm install -g @devbolt/cli
devbolt init
npm install @devbolt/sdk
```

```ts
import { initialize } from '@devbolt/sdk'

const client = initialize()

if (client.isEnabled('new_feature')) {
  // new feature
}
```

### Python

```bash
pip install devbolt
```

```python
from devbolt import DevBoltClient

client = DevBoltClient()

if client.is_enabled("new_feature"):
    pass
```

---

## Features

- Boolean flags  
- Deterministic percentage rollouts  
- Rich targeting with many operators  
- Environment overrides  
- Auto reload in development  
- Type safe APIs  
- Zero external services required  

---

## Comparison With Hosted Services

| Feature                     | DevBolt | LaunchDarkly | Split.io |
|-----------------------------|---------|--------------|----------|
| Cost                        | Free 😇 | $$$$         | $$$$     |
| Works offline               | Yes     | No           | No       |
| Git native config          | Yes     | Partial      | No       |
| Simple CLI                 | Yes     | No           | No       |
| Deterministic rollouts     | Yes     | Yes          | Yes      |
| Self hosted infrastructure | Not needed | Needed for enterprise | Needed |

No shade. Just facts. And some cash sign emojis.

---

## Documentation

📘 https://github.com/ModelRed/devbolt

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Support

- Documentation  
- Discussions  
- Issue Tracker  
