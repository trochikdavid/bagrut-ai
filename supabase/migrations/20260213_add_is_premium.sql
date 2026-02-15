-- Add is_premium column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Update existing users to be premium (optional, for testing)
-- UPDATE profiles SET is_premium = TRUE WHERE email = 'admin@bagrut.ai';
