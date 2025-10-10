-- Add RLS policy to allow user registration (INSERT)
-- This policy allows anyone (even unauthenticated users) to insert a new user record
-- This is necessary for the registration flow

CREATE POLICY users_insert_registration
ON users
FOR INSERT
TO public
WITH CHECK (true);

COMMENT ON POLICY users_insert_registration ON users IS 'Allow user registration - anyone can insert a new user record';
