-- After creating your admin account, replace the email below and run this once.
-- This is intentionally a manual server-side step so a normal user cannot self-promote to admin.
update public.profiles p
set account_type='admin', status='active', updated_at=now()
from auth.users u
where p.user_id=u.id and lower(u.email)=lower('YOUR_ADMIN_EMAIL@example.com');
