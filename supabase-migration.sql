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

-- 5. BUSINESS CONTACTS MANAGEMENT TABLE (Multi-Contact & Configurable Primary)
CREATE TABLE IF NOT EXISTS public.business_contacts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    display_phone TEXT NOT NULL,
    is_whatsapp_enabled BOOLEAN DEFAULT TRUE,
    is_call_enabled BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active business contacts" ON public.business_contacts;
DROP POLICY IF EXISTS "Allow contact management" ON public.business_contacts;

-- Public visitors can read active business contacts
CREATE POLICY "Public can view active business contacts"
    ON public.business_contacts
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Admin and backend can manage all contacts
CREATE POLICY "Allow contact management"
    ON public.business_contacts
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- Seed initial business contacts
INSERT INTO public.business_contacts (
    id, label, phone_number, display_phone, is_whatsapp_enabled, is_call_enabled, is_primary, display_order, is_active
) VALUES
('contact-1', 'Harish & Founders (Primary Desk)', '+917092507374', '+91 70925 07374', true, true, true, 1, true),
('contact-2', 'Technical & Site Operations', '+918668181232', '+91 86681 81232', true, true, false, 2, true),
('contact-3', 'Customer Enquiries & Estimation', '+918939538014', '+91 89395 38014', true, true, false, 3, true)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    phone_number = EXCLUDED.phone_number,
    display_phone = EXCLUDED.display_phone,
    is_whatsapp_enabled = EXCLUDED.is_whatsapp_enabled,
    is_call_enabled = EXCLUDED.is_call_enabled,
    is_primary = EXCLUDED.is_primary,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 6. CAREERS & JOB OPENINGS MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS public.job_openings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    experience TEXT NOT NULL,
    qualification TEXT NOT NULL,
    salary TEXT,
    job_type TEXT DEFAULT 'Full-Time',
    description TEXT NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    openings_count INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active job openings" ON public.job_openings;
DROP POLICY IF EXISTS "Allow job openings management" ON public.job_openings;

-- Public can view active jobs
CREATE POLICY "Public can view active job openings"
    ON public.job_openings
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Admin and backend can manage all jobs
CREATE POLICY "Allow job openings management"
    ON public.job_openings
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 7. JOB APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL,
    location TEXT NOT NULL,
    years_of_experience TEXT NOT NULL,
    qualification TEXT NOT NULL,
    resume_url TEXT,
    resume_file_name TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public job application submission" ON public.job_applications;
DROP POLICY IF EXISTS "Allow admin job applications management" ON public.job_applications;

-- Public applicants can submit applications
CREATE POLICY "Allow public job application submission"
    ON public.job_applications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin can manage and view applications
CREATE POLICY "Allow admin job applications management"
    ON public.job_applications
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 8. RESUMES STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('vshn-resumes', 'vshn-resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow resume upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow resume viewing" ON storage.objects;

CREATE POLICY "Allow resume upload"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'vshn-resumes');

CREATE POLICY "Allow resume viewing"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'vshn-resumes');

-- Seed initial Chennai job openings
INSERT INTO public.job_openings (
    id, title, location, experience, qualification, salary, job_type, description, skills, openings_count, is_active, display_order
) VALUES
(
    'job-1',
    'Civil Site Engineer (Residential Projects)',
    'Chennai (Tondiarpet, Kolathur, Madhavaram & Suburbs)',
    '2 - 5 Years in Residential Building Construction',
    'B.E. Civil Engineering / Diploma in Civil',
    '₹30,000 - ₹50,000 / month (Commensurate with experience)',
    'Full-Time',
    'Lead on-site structural execution, RCC column casting, brickwork verification, concrete pour monitoring, material quality inspection, and daily labor coordination for turnkey independent houses and villas across Chennai.',
    '["Site Execution", "RCC Quality Inspection", "Bar Bending Schedules", "Material Estimation", "AutoCAD", "Vendor Coordination"]'::jsonb,
    2,
    true,
    1
),
(
    'job-2',
    'Architectural Designer & 3D Visualizer',
    'Chennai (Office & Site Visits)',
    '1 - 4 Years in Residential Architecture',
    'B.Arch / Diploma in Architectural Assistantship / CAD Certified',
    '₹28,000 - ₹45,000 / month',
    'Full-Time',
    'Develop 2D Vaastu-compliant architectural floor plans, photorealistic 3D exterior elevations, walkthrough animations, and structural approval drawings for custom dream home clients.',
    '["AutoCAD", "3ds Max / SketchUp", "V-Ray / Lumion", "Vaastu Shastra Planning", "Photoshop", "Working Drawings"]'::jsonb,
    1,
    true,
    2
),
(
    'job-3',
    'Site Supervisor & Quality Inspector',
    'Chennai Sites',
    '3 - 7 Years in Civil Site Supervision',
    'Diploma / ITI Civil / High School with rich site experience',
    '₹25,000 - ₹38,000 / month',
    'Full-Time',
    'Supervise daily masonry, curing periods, steel reinforcement checks, plastering smoothness, electrical and plumbing conduits, and milestone handover inspections on residential job sites.',
    '["Site Supervision", "Quality Control", "Masonry & Curing", "Daily Progress Reporting", "Labour Management"]'::jsonb,
    2,
    true,
    3
)
ON CONFLICT (id) DO NOTHING;


