CREATE TABLE public.pending_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  email text NOT NULL,
  otp text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.pending_registrations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON public.pending_registrations
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update" ON public.pending_registrations
  FOR UPDATE TO anon USING (true) WITH CHECK (true);