-- Create role enum for different user types
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create user_roles table to manage permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on warehouse_items
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Authenticated users can view all items" ON public.warehouse_items;

-- New RLS policies for warehouse_items
-- All authenticated users can view
CREATE POLICY "Employees can view all warehouse items"
ON public.warehouse_items
FOR SELECT
TO authenticated
USING (true);

-- Only managers and admins can insert
CREATE POLICY "Managers can insert warehouse items"
ON public.warehouse_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Only managers and admins can update
CREATE POLICY "Managers can update warehouse items"
ON public.warehouse_items
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Only managers and admins can delete
CREATE POLICY "Managers can delete warehouse items"
ON public.warehouse_items
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);