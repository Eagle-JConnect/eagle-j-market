-- EAGLE-J MARKET: Admin hardening for the schema in schema.sql.
-- Run this in Supabase SQL Editor as the project owner.
-- IMPORTANT: Replace the email in the final bootstrap UPDATE before running it.

-- Ensure demand permission fields exist for older deployments.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_post_demand boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_respond_demand boolean NOT NULL DEFAULT false;

-- Admin check: only an active profile explicitly marked admin qualifies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.account_type = 'admin'
      AND p.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Stop a normal signed-in user from promoting their own account, suspending
-- their own account, or granting themselves demand permissions through the
-- existing broad profiles UPDATE policy. SQL Editor/admin operations with no
-- auth.uid() can still bootstrap the first admin.
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.account_type IS DISTINCT FROM OLD.account_type
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.can_post_demand IS DISTINCT FROM OLD.can_post_demand
       OR NEW.can_respond_demand IS DISTINCT FROM OLD.can_respond_demand THEN
      RAISE EXCEPTION 'Only an administrator can change account status, account type, or demand permissions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Keep administrative moderation policies explicit and repeatable.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_responses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see/update their own profile; active admins can manage all.
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Businesses: public visitors see approved listings; owners see their own;
-- admins can see/moderate all listings.
DROP POLICY IF EXISTS businesses_read ON public.businesses;
CREATE POLICY businesses_read ON public.businesses
FOR SELECT
USING (status = 'approved' OR owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS businesses_insert ON public.businesses;
CREATE POLICY businesses_insert ON public.businesses
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS businesses_update ON public.businesses;
CREATE POLICY businesses_update ON public.businesses
FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin())
WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS businesses_delete ON public.businesses;
CREATE POLICY businesses_delete ON public.businesses
FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

-- Payments: owners can view their own; only admins can mark/update payment status.
DROP POLICY IF EXISTS payments_read ON public.payments;
CREATE POLICY payments_read ON public.payments
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS payments_update ON public.payments;
CREATE POLICY payments_update ON public.payments
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Demand moderation. Owners may edit/delete their own demands; only admins
-- may approve/reject/close other users' demands.
DROP POLICY IF EXISTS demands_read ON public.demands;
CREATE POLICY demands_read ON public.demands
FOR SELECT
USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS demands_update ON public.demands;
CREATE POLICY demands_update ON public.demands
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS demands_delete ON public.demands;
CREATE POLICY demands_delete ON public.demands
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- User-facing demand access is controlled by the protected profile flags above.
-- Admin-only management for responses is also enabled by this policy.
DROP POLICY IF EXISTS demand_responses_update ON public.demand_responses;
CREATE POLICY demand_responses_update ON public.demand_responses
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS demand_responses_delete ON public.demand_responses;
CREATE POLICY demand_responses_delete ON public.demand_responses
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Prevent owners from approving their own business or changing admin-only
-- verification/featured flags. An active admin can still moderate normally.
CREATE OR REPLACE FUNCTION public.protect_business_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.verified IS DISTINCT FROM OLD.verified
       OR NEW.featured IS DISTINCT FROM OLD.featured THEN
      RAISE EXCEPTION 'Only an administrator can change business approval, verification, or featured status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_business_moderation_fields ON public.businesses;
CREATE TRIGGER protect_business_moderation_fields
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.protect_business_moderation_fields();

-- Prevent demand owners from self-approving/rejecting/closing their own posts.
CREATE OR REPLACE FUNCTION public.protect_demand_moderation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin()
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only an administrator can change demand moderation status.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_demand_moderation_status ON public.demands;
CREATE TRIGGER protect_demand_moderation_status
BEFORE UPDATE ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.protect_demand_moderation_status();

-- FIRST ADMIN BOOTSTRAP:
-- Replace the email below with the email of the account you already registered.
-- Run this statement manually as the Supabase project owner. Never expose the
-- service_role key in browser JavaScript.
UPDATE public.profiles p
SET account_type = 'admin', status = 'active', updated_at = now()
FROM auth.users u
WHERE p.user_id = u.id
  AND lower(u.email) = lower('YOUR_ADMIN_EMAIL@example.com');

-- Confirm the account was promoted. This should return your profile row.
SELECT p.user_id, u.email, p.account_type, p.status
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE lower(u.email) = lower('YOUR_ADMIN_EMAIL@example.com');
