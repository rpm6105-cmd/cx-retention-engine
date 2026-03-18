-- Step 1: Add is_approved column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Step 2: Auto-approve the owner account
UPDATE public.profiles
SET is_approved = true
WHERE email = 'rpm6105@gmail.com';

-- Step 3: Enable pg_net extension for HTTP calls (needed for email notifications)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 4: Update the handle_new_user trigger to set is_approved
-- Owner is auto-approved, everyone else needs approval
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, plan, is_owner, is_approved)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Starter',
    new.email = 'rpm6105@gmail.com',
    new.email = 'rpm6105@gmail.com'  -- owner auto-approved, others not
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Step 5: Create notification function that fires when a new non-owner user signs up
-- Replace YOUR_RESEND_API_KEY below with your actual Resend API key
CREATE OR REPLACE FUNCTION public.notify_owner_on_signup()
RETURNS trigger AS $$
BEGIN
  -- Only notify for non-owner signups
  IF NEW.is_owner = false THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_RESEND_API_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'CX App <onboarding@resend.dev>',
        'to', ARRAY['rpm6105@gmail.com'],
        'subject', 'New signup: ' || NEW.name || ' (' || NEW.email || ')',
        'html', '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <span style="color: white; font-size: 20px; font-weight: 800;">CX App</span>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <h2 style="margin: 0 0 8px; color: #0f172a;">New user signed up</h2>
            <p style="color: #6b7280; margin: 0 0 16px;">A new user is waiting for your approval.</p>
            <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <div style="font-size: 13px; color: #374151;"><strong>Name:</strong> ' || NEW.name || '</div>
              <div style="font-size: 13px; color: #374151; margin-top: 4px;"><strong>Email:</strong> ' || NEW.email || '</div>
            </div>
            <a href="https://cx-retention-engine.vercel.app/admin" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Go to Admin → Approve user
            </a>
          </div>
        </div>'
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Step 6: Create trigger that fires after new profile is inserted
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.notify_owner_on_signup();

-- Step 7: Update RLS policy so owner can update any profile (for approval)
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
CREATE POLICY "Owner can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner = true)
);
