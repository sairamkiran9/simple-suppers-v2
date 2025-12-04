#!/bin/bash
# Seed test database with sample data

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_NAME="${DB_NAME:-simple_suppers_test}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "Seeding test database..."

# Run migrations first
echo "Running migrations..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Apply Supabase migrations
for migration in supabase/migrations/*.sql; do
    echo "Applying migration: $(basename $migration)"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration" || true
done

# Run seed files
echo "Running seed files..."
for seed in supabase/seed/*.sql; do
    echo "Applying seed: $(basename $seed)"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$seed" || true
done

echo "Test database seeded successfully!"
