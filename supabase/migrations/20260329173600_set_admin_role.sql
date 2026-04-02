-- Set admin role for sanzonyvoz@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'sanzonyvoz@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
