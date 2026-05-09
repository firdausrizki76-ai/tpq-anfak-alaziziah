-- ============================================
-- SQL UPDATE SCRIPT FOR TPQ
-- Please run this in the Supabase SQL Editor
-- ============================================

-- 1. UPDATE SANTRI TABLE
ALTER TABLE santri
ADD COLUMN IF NOT EXISTS anak_ke INT,
ADD COLUMN IF NOT EXISTS jumlah_saudara INT,
ADD COLUMN IF NOT EXISTS nik VARCHAR(20),
ADD COLUMN IF NOT EXISTS rt VARCHAR(5),
ADD COLUMN IF NOT EXISTS rw VARCHAR(5),
ADD COLUMN IF NOT EXISTS desa VARCHAR(50),
ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(50),
ADD COLUMN IF NOT EXISTS kabupaten VARCHAR(50),
ADD COLUMN IF NOT EXISTS hobi VARCHAR(100),
ADD COLUMN IF NOT EXISTS cita_cita VARCHAR(100),
ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20),
ADD COLUMN IF NOT EXISTS nik_ayah VARCHAR(20),
ADD COLUMN IF NOT EXISTS pekerjaan_ayah VARCHAR(50),
ADD COLUMN IF NOT EXISTS pendidikan_ayah VARCHAR(50),
ADD COLUMN IF NOT EXISTS nik_ibu VARCHAR(20),
ADD COLUMN IF NOT EXISTS pekerjaan_ibu VARCHAR(50),
ADD COLUMN IF NOT EXISTS pendidikan_ibu VARCHAR(50),
ADD COLUMN IF NOT EXISTS pekerjaan_wali VARCHAR(50),
ADD COLUMN IF NOT EXISTS hubungan_keluarga VARCHAR(50),
ADD COLUMN IF NOT EXISTS no_hp_ayah VARCHAR(20),
ADD COLUMN IF NOT EXISTS no_hp_ibu VARCHAR(20),
ADD COLUMN IF NOT EXISTS tanggal_keluar DATE;

-- 2. UPDATE GURU TABLE
ALTER TABLE guru
ADD COLUMN IF NOT EXISTS nik VARCHAR(20),
ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20),
ADD COLUMN IF NOT EXISTS rt VARCHAR(5),
ADD COLUMN IF NOT EXISTS rw VARCHAR(5),
ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(100);

-- 3. UPDATE KELAS TABLE
ALTER TABLE kelas
ADD COLUMN IF NOT EXISTS wali_kelas_id UUID REFERENCES guru(id) ON DELETE SET NULL;

-- 4. UPDATE RIWAYAT KELAS (UJIAN)
ALTER TABLE riwayat_kelas
ADD COLUMN IF NOT EXISTS tanggal_mulai DATE,
ADD COLUMN IF NOT EXISTS tanggal_selesai DATE;

-- UPDATE TARGET PENCAPAIAN
ALTER TABLE target_pencapaian
ADD COLUMN IF NOT EXISTS tanggal_mulai DATE;

-- Update View Saldo Tabungan to include kelas to show correctly
-- Actually the view doesn't need to change for tabungan.

-- 5. TABUNGAN ROLE PERMISSIONS
-- Tabungan was requested to be inputted by Guru per class.
-- We might need RLS policies, but we can do that in frontend.

-- ============================================
-- FINISHED
-- ============================================
