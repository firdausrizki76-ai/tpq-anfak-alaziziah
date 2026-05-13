-- ============================================
-- FIX ABSENSI ID DEFAULT VALUE
-- Jalankan ini di Supabase SQL Editor jika masih muncul error "null value in column id"
-- ============================================

-- Memastikan extension pgcrypto aktif untuk gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Memastikan kolom id memiliki default value uuid otomatis
ALTER TABLE absensi 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Memastikan kolom id tidak boleh null (sebagai primary key)
ALTER TABLE absensi 
ALTER COLUMN id SET NOT NULL;
