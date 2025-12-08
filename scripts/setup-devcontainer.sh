#!/bin/bash
# Setup script for dev container

set -e

echo "🚀 Setting up Simple Suppers development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "⚠️  Please update .env.local with your actual values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Wait for databases to be ready
echo "⏳ Waiting for databases..."
until PGPASSWORD=postgres psql -h postgres-dev -U postgres -c '\q' 2>/dev/null; do
    echo "Waiting for dev database..."
    sleep 2
done

until PGPASSWORD=postgres psql -h postgres-test -U postgres -c '\q' 2>/dev/null; do
    echo "Waiting for test database..."
    sleep 2
done

echo "✅ Databases are ready!"

# Run migrations if needed
# echo "🔄 Running migrations..."
# npm run supabase:migrate

echo ""
echo "✨ Setup complete! You can now:"
echo "   - Run 'npm run dev' to start the development server"
echo "   - Run 'npm test' to run tests"
echo "   - Run 'make docker-test' to run tests in Docker"
echo ""
