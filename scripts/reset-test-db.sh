#!/bin/bash
# Reset test database to clean state

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_NAME="${DB_NAME:-simple_suppers_test}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "Resetting test database..."

# Drop and recreate database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<-EOSQL
    DROP DATABASE IF EXISTS $DB_NAME;
    CREATE DATABASE $DB_NAME;
EOSQL

echo "Database reset complete. Running migrations and seeds..."

# Run seed script
bash scripts/seed-test-db.sh

echo "Test database reset successfully!"
