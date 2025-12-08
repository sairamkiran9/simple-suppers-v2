-- Initialize PostgreSQL database for testing
-- This script runs automatically when the container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE simple_suppers_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'simple_suppers_test')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE simple_suppers_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE simple_suppers_test TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully';
END $$;
