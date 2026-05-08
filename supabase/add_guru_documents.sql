-- ============================================
-- TAMBAH KOLOM DOKUMEN GURU
-- Jalankan di Supabase SQL Editor
-- ============================================

ALTER TABLE guru 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS kk_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_url TEXT,
ADD COLUMN IF NOT EXISTS ijazah_url TEXT;
