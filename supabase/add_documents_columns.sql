-- ============================================
-- TAMBAH KOLOM DOKUMEN SANTRI
-- Jalankan di Supabase SQL Editor
-- ============================================

ALTER TABLE santri 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS kk_url TEXT,
ADD COLUMN IF NOT EXISTS akte_url TEXT;
