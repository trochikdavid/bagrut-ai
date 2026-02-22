-- Add agreement columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_version TEXT,
ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_version TEXT,
ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT false;

-- Update the handle_new_user function to include agreement metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        name, 
        email, 
        role,
        terms_agreed,
        terms_version,
        privacy_agreed,
        privacy_version,
        is_adult
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'student',
        COALESCE((NEW.raw_user_meta_data->>'terms_agreed')::boolean, false),
        NEW.raw_user_meta_data->>'terms_version',
        COALESCE((NEW.raw_user_meta_data->>'privacy_agreed')::boolean, false),
        NEW.raw_user_meta_data->>'privacy_version',
        COALESCE((NEW.raw_user_meta_data->>'is_adult')::boolean, false)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
