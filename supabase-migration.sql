-- ==============================================================================
-- VSHN BUILDERS — SUPABASE PRODUCTION DATABASE MIGRATION & RLS POLICIES
-- Project URL: https://gybfpnothqoptffhmont.supabase.co
-- ==============================================================================

-- 1. WEBSITE CONTENT TABLE (Single Source of Truth)
CREATE TABLE IF NOT EXISTS public.website_content (
    id TEXT PRIMARY KEY DEFAULT 'current',
    published_content JSONB NOT NULL,
    draft_content JSONB,
    version INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'harish'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if rerun
DROP POLICY IF EXISTS "Public can view published website content" ON public.website_content;
DROP POLICY IF EXISTS "Allow content management" ON public.website_content;

-- Public visitors (anon) can read current website content
CREATE POLICY "Public can view published website content"
    ON public.website_content
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Admin & API server can insert, update, or upsert website content
CREATE POLICY "Allow content management"
    ON public.website_content
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 2. CONTACT / CONSULTATION ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    plot_location TEXT,
    service_needed TEXT,
    estimated_sq_ft NUMERIC,
    preferred_package TEXT,
    budget_range TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit enquiries" ON public.contact_submissions;
DROP POLICY IF EXISTS "Manage enquiries" ON public.contact_submissions;

-- Any visitor can submit consultation enquiries
CREATE POLICY "Public can submit enquiries"
    ON public.contact_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin can read and update enquiry status
CREATE POLICY "Manage enquiries"
    ON public.contact_submissions
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 3. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    user_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activity logs access" ON public.activity_logs;

CREATE POLICY "Activity logs access"
    ON public.activity_logs
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 4. STORAGE BUCKET FOR MEDIA UPLOADS
-- Creates 'vshn-media' public bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vshn-media', 'vshn-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete from media bucket" ON storage.objects;

CREATE POLICY "Public can view media"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'vshn-media');

CREATE POLICY "Allow upload to media bucket"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'vshn-media');

CREATE POLICY "Allow delete from media bucket"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'vshn-media');
