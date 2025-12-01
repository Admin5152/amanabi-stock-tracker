-- Allow managers and admins to view all profiles
CREATE POLICY "Managers and admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create a function to log user login events (will be called via trigger)
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the login event
  INSERT INTO public.activity_logs (user_id, action, description, metadata)
  VALUES (
    NEW.id,
    'USER_LOGIN',
    'User logged in',
    jsonb_build_object(
      'email', (SELECT email FROM auth.users WHERE id = NEW.id),
      'login_time', now()
    )
  );
  RETURN NEW;
END;
$$;