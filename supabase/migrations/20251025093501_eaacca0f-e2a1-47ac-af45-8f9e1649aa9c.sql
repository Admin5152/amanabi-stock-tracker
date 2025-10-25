-- Add INSERT policy for profiles table
-- This ensures users can only create their own profile during registration
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);