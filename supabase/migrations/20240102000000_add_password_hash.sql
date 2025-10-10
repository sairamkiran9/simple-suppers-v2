-- Add password_hash column to users table for email/password authentication
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Add index on password_hash for faster lookups
CREATE INDEX idx_users_password_hash ON users(password_hash) WHERE password_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for email/password authentication';
