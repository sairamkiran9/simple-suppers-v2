#!/bin/bash
# Quick Docker test runner for Linux/Mac
# Usage: ./test-docker.sh

set -e

echo "🧪 Running Docker tests..."
echo ""

# Clean up any existing containers
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Run tests
echo "🚀 Starting tests..."
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Capture exit code
EXIT_CODE=$?

# Clean up
echo ""
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down

# Report results
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tests passed!"
else
    echo "❌ Tests failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
