INSERT INTO public.user_roles (user_id, role) 
VALUES ('47f90102-1516-4fc3-ab9e-91bb5ffda322', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;