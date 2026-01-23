-- ==========================================
-- MC2 Legal Dashboard - Add Document Type Field
-- Migration: Add type column to documents table
-- ==========================================

-- Add type column to documents table (safe to run multiple times)
alter table documents add column if not exists type text check (type in ('url', 'file')) default 'url';

-- Update existing documents to have 'url' type if NULL
update documents set type = 'url' where type is null;

-- ==========================================
-- Storage Setup for Document Uploads
-- ==========================================

-- Create storage bucket for documents if it doesn't exist
-- Note: This needs to be run in Supabase Dashboard SQL Editor
-- or via Supabase CLI as storage.buckets might not be accessible

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to documents bucket
-- CREATE POLICY "Public read access for documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents');

-- Create policy to allow authenticated users to upload
-- CREATE POLICY "Allow upload for authenticated users"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents');

-- Create policy to allow users to delete their own documents
-- CREATE POLICY "Allow delete for authenticated users"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'documents');
