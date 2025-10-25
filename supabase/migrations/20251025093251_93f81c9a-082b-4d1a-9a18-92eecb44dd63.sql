-- Fix profiles: Ensure only authenticated users can view profiles, and only their own
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix warehouse_items: Restrict SELECT to authenticated employees/managers/admins only
DROP POLICY IF EXISTS "Employees can view all warehouse items" ON public.warehouse_items;

CREATE POLICY "Authenticated employees can view warehouse items"
ON public.warehouse_items
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);