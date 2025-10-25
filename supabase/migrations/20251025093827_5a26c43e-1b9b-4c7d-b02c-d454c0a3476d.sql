-- Fix user_roles table public access - restrict to authenticated users only
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate policies with explicit authenticated restriction
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Set default value for created_by column in warehouse_items
ALTER TABLE public.warehouse_items 
ALTER COLUMN created_by SET DEFAULT auth.uid();