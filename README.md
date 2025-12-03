# DevBolt ⚡

<div align="center">

[![CI](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml/badge.svg)](https://github.com/ModelRed/devbolt/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](#)
[![Downloads](https://img.shields.io/npm/dm/%40devbolt%2Fcore.svg)](https://www.npmjs.com/package/@devbolt/core)
[![Stars](https://img.shields.io/github/stars/ModelRed/devbolt.svg)](https://github.com/ModelRed/devbolt)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Feature flags that live in your repo, not your nightmares**

[Documentation](https://github.com/ModelRed/devbolt) • [Quick Start](#quick-start) • [Examples](#examples)

</div>

---

## What is DevBolt?

DevBolt is a git-native feature flag system for developers who think $1,000/month for boolean flags is ridiculous. Your flags live in `.devbolt/flags.yml` alongside your code, version controlled and committed like everything else that matters.

The core is free and open source. Works offline, in CI, and in production without mandatory cloud dependencies.

Perfect for solo devs building their next project, startups watching their burn rate, and teams that value simplicity over sales presentations.

---

## Why DevBolt?

**The honest comparison:**

- 💸 **Free core** - Open source, git-native core that does everything you need. Forever.
- 📝 **Git native** - Your flags live in `.devbolt/flags.yml`, version controlled like a grown-up project
- 🔒 **Offline friendly** - Works in basements, airplanes, and countries with questionable internet
- 🧰 **Developer first** - CLI and SDKs for JS/TS/Python. No sales demo required
- 🎛️ **Full featured** - Rollouts, targeting rules, environments. Everything you'd expect
- ⚡ **Fast** - Deterministic hashing, zero network calls for flag evaluation

Meanwhile, the alternatives will charge you $20k/year from day one to store YAML in their cloud. We're taking a different approach: free git-native core.

---

## How It Works

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

---

## Quick Start

### JavaScript / TypeScript

```bash
# Install CLI
npm install -g @devbolt/cli

# Initialize in your project
devbolt init

# Install SDK
npm install @devbolt/sdk
```

```typescript
import { initialize } from "@devbolt/sdk";

const client = initialize();

if (client.isEnabled("new_feature")) {
  // Ship it! 🚀
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
    # Feature unlocked 🔓
    pass
```

---

## Features

**Everything you actually need:**

- ✅ Boolean flags (the classics)
- ✅ Percentage rollouts with deterministic hashing
- ✅ Rich targeting rules (user IDs, attributes, you name it)
- ✅ Environment overrides (dev, staging, prod)
- ✅ Auto-reload in development (because `ctrl+c` is tedious)
- ✅ Type-safe APIs (TypeScript loves us)
- ✅ Zero external dependencies (no surprise CVEs)

**What you won't deal with:**

- ❌ Monthly bills that make you question your career choices
- ❌ "Enterprise" features locked behind sales calls
- ❌ Rate limits on your own boolean flags
- ❌ Forced upgrades to access basic functionality
- ❌ Vendor lock-in disguised as "integrations"

---

## CLI Examples

```bash
# Create a new flag
devbolt create new_checkout --enabled

# Set up a gradual rollout
devbolt rollout new_checkout 25

# Target specific users
devbolt target new_checkout --add-user user_123

# Check what a user sees
devbolt status new_checkout --user-id user_123

# List all your flags
devbolt list

# Clean up when done
devbolt remove old_feature --force
```

---

## The Honest Comparison

| Feature                        | DevBolt    | LaunchDarkly                            | Split.io                     |
| ------------------------------ | ---------- | --------------------------------------- | ---------------------------- |
| **Monthly cost**               | $0         | Starts at $10/seat, scales to $$$$      | "Contact sales" (red flag)   |
| **Works offline**              | ✅ Always  | ❌ Good luck                            | ❌ Nope                      |
| **Setup time**                 | 30 seconds | 30 minutes + Zoom onboarding            | Call scheduled for next week |
| **Config location**            | Your repo  | Their servers (hope they don't go down) | Their servers                |
| **Surprise price increases**   | Impossible | When you hit "MAU limits"               | After the contract renewal   |
| **Requires credit card**       | No         | Yes (even for trial)                    | Yes                          |
| **Sales calls**                | Never      | Eventually inevitable                   | Required for real pricing    |
| **Deterministic rollouts**     | ✅ Yes     | ✅ Yes                                  | ✅ Yes                       |
| **Self-hosted infrastructure** | Not needed | Extra cost                              | Extra cost                   |

Look, LaunchDarkly and Split.io are great products. They have fancy dashboards, real-time updates, and excellent docs. They're perfect if you're a Fortune 500 company with a dedicated DevOps team and budget to match.

But if you're:

- A solo dev building a SaaS
- A startup watching your burn rate
- A team that prefers terminal over UI
- Anyone who thinks feature flags shouldn't cost more than your database

Then DevBolt might be your jam.

---

## Advanced Usage

### Percentage Rollouts

```typescript
// In your flags.yml
new_checkout:
  enabled: true
  rollout: 25  # 25% of users see the new feature
```

```typescript
// Same user always gets the same result (deterministic)
const showNewCheckout = client.isEnabled("new_checkout", {
  userId: "user_123",
});
```

### Targeting Rules

```yaml
premium_features:
  enabled: true
  targeting:
    rules:
      - attribute: plan
        operator: equals
        values: ["premium", "enterprise"]
```

```typescript
const canAccessPremium = client.isEnabled("premium_features", {
  attributes: { plan: "premium" },
});
```

### Environment Overrides

```yaml
debug_mode:
  enabled: false
  environments:
    development: true
    staging: true
    production: false
```

### From Feature Flag Chaos

Rolling your own with ENV vars and if statements? We've been there:

```typescript
// Before: The horrors
if (process.env.NEW_FEATURE === "true" || user.email.includes("@company.com")) {
  // Hope this works in production 🤞
}

// After: Civilized
if (client.isEnabled("new_feature", { userId: user.id })) {
  // Deterministic, testable, version controlled ✨
}
```

---

## Contributing

We welcome contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## FAQ

**Q: Is this really free?**  
A: Yes. MIT licensed. No hidden costs, no bait-and-switch.

**Q: How does it work offline?**  
A: Everything is local. No API calls, no network checks. Your flags are literally files in your repo.

**Q: What about real-time updates?**  
A: Currently, you deploy config changes like you deploy code. Git push, CI/CD, done. For teams that need instant remote flag changes, we're exploring hosted options that keep the git-native approach while adding real-time capabilities.

**Q: Can I use this in production?**  
A: Absolutely. It's deterministic, and fast. Just another file in your build.

**Q: Is this enterprise ready?**  
A: If "enterprise ready" means "works reliably without surprise bills," then yes. If it means "has a sales team that will take you to golf," then no.

**Q: Why did you make this?**  
A: Got tired of $1,000/month bills for boolean flags. Built this out of spite.

---

## Roadmap

**Coming soon:**

- [ ] 📊 Optional hosted analytics dashboard (for teams that want insights)
- [ ] ⚡ Real-time flag updates via hosted service (optional add-on)
- [ ] 🧪 A/B testing helpers and statistical analysis
- [ ] 🌍 More SDK languages (Go, Rust, Ruby, PHP)
- [ ] 🔧 IDE extensions (VSCode, JetBrains)
- [ ] 🔄 Migration tools from LaunchDarkly/Split.io
- [ ] 🔗 Flag dependency management
- [ ] 📱 Mobile SDKs (iOS, Android)

**The core will always be free and git-native.** Hosted features will be optional and reasonably priced (because we're not monsters).

---

## License

MIT License. See [LICENSE](LICENSE).

Do whatever you want with it. Build a business. Save some money. Stick it to the enterprise SaaS industrial complex.

---

## Support

- 📖 [Documentation](https://github.com/ModelRed/devbolt)
- 💬 [Discussions](https://github.com/ModelRed/devbolt/discussions)
- 🐛 [Issue Tracker](https://github.com/ModelRed/devbolt/issues)

---

<div align="center">

**Made with ❤️ and frustration with SaaS pricing**

If DevBolt saved you from a LaunchDarkly invoice, [star the repo](https://github.com/ModelRed/devbolt) ⭐

</div>
