# Contributing to DevBolt

Thanks for your interest in contributing! This document provides guidelines for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/ModelRed/devbolt.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`

## Development Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
./test-all.sh

# Run specific package tests
cd packages/core && npm test
cd packages/sdk-js && npm test
cd packages/sdk-python && pytest
```

## Pull Request Process

1. **Create an issue first** for significant changes
2. **Write tests** for new features
3. **Update documentation** as needed
4. **Follow code style** (ESLint/Prettier/Ruff)
5. **Write clear commit messages** (use conventional commits)
6. **Keep PRs focused** - one feature/fix per PR

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(core): add new targeting operator`
- `fix(cli): handle missing config file`
- `docs: update installation guide`

## Testing

- Write tests for all new features
- Maintain >80% code coverage
- Test on multiple platforms (Windows/Mac/Linux)

## Code Style

### TypeScript

- Use ESLint + Prettier
- Run `npm run lint` before committing

### Python

- Use Ruff + Black
- Run `ruff check devbolt/` before committing

## Questions?

Ask in [GitHub Discussions](https://github.com/ModelRed/devbolt/discussions).
