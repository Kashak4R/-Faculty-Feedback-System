-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('student', 'faculty'));

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update RLS policy to allow users to view profiles with role
-- (The existing policies should work, but we ensure role is accessible)

-- Update the handle_new_user function to include role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with role from metadata
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', NULL)::TEXT
  );
  
  RETURN new;
END;
$$;

