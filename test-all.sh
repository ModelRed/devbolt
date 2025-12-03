#!/bin/bash

set -e

echo "🧪 Running DevBolt Test Suite"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

# Detect Python command (python3 or python)
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}✗${NC} Python not found. Please install Python 3.8+"
    exit 1
fi

echo "Using Python: $PYTHON_CMD ($($PYTHON_CMD --version))"

# 1. Build everything first
echo ""
echo "📦 Building all packages..."
npm run build
print_status "Build completed"

# 2. Run TypeScript tests
echo ""
echo "🔷 Running TypeScript Core tests..."
cd packages/core
npm test
print_status "Core tests passed"
cd ../..

echo ""
echo "🔷 Running TypeScript SDK tests..."
cd packages/sdk-js
npm test
print_status "SDK-JS tests passed"
cd ../..

echo ""
echo "🔷 Running CLI tests..."
cd packages/cli
npm test
print_status "CLI tests passed"
cd ../..

# 3. Run Python tests with virtual environment
echo ""
echo "🐍 Running Python SDK tests..."
cd packages/sdk-python

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    $PYTHON_CMD -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/update dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -e ".[dev]"

# Run tests
$PYTHON_CMD -m pytest tests/ -v --cov=devbolt --cov-report=term-missing

# Deactivate virtual environment
deactivate

print_status "Python tests passed"
cd ../..

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Coverage reports:"
echo "  - Core: packages/core/coverage/"
echo "  - SDK-JS: packages/sdk-js/coverage/"
echo "  - CLI: packages/cli/coverage/"
echo "  - Python: packages/sdk-python/htmlcov/"
echo ""
