-- Migration: Update user profile creation to use email prefix as username and set default avatar
-- Date: 2024-01-08

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  default_avatar_url TEXT;
BEGIN
  -- Extract username from email (part before @)
  username_value := SPLIT_PART(NEW.email, '@', 1);
  
  -- Set default avatar URL (you can change this to your preferred default avatar)
  default_avatar_url := 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, username, avatar_url, created_at)
  VALUES (
    NEW.id,
    username_value,
    default_avatar_url,
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username already exists, append a random suffix
    username_value := username_value || '_' || substr(md5(random()::text), 1, 6);
    
    INSERT INTO public.profiles (id, username, avatar_url, created_at)
    VALUES (
      NEW.id,
      username_value,
      default_avatar_url,
      NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user profile on signup with username from email prefix and default avatar';