INSERT INTO public.user_roles (user_id, role)
VALUES ('7d31e454-d4a1-4237-924c-bbb639737141', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
