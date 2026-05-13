-- ==================================================================
-- ULTIMATE FIX FOR ALL TABLE ID CONSTRAINTS
-- Jalankan script ini di Supabase SQL Editor
-- Script ini akan memaksa semua tabel memiliki ID otomatis (UUID)
-- ==================================================================

-- 1. Pastikan extension pgcrypto aktif untuk fungsi gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Perbaiki tabel MASTER
ALTER TABLE kelas ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE kelas ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE guru ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE guru ALTER COLUMN status SET DEFAULT 'aktif';
ALTER TABLE guru ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE santri ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE santri ALTER COLUMN status SET DEFAULT 'aktif';
ALTER TABLE santri ALTER COLUMN created_at SET DEFAULT NOW();

-- 3. Perbaiki tabel TRANSAKSI & OPERASIONAL
ALTER TABLE absensi ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE absensi ALTER COLUMN tanggal SET DEFAULT CURRENT_DATE;
ALTER TABLE absensi ALTER COLUMN waktu_scan SET DEFAULT NOW();
ALTER TABLE absensi ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE jenis_pembayaran ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE jenis_pembayaran ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE jenis_pembayaran ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE pembayaran ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pembayaran ALTER COLUMN tanggal_bayar SET DEFAULT CURRENT_DATE;
ALTER TABLE pembayaran ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE tabungan_santri ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tabungan_santri ALTER COLUMN tanggal SET DEFAULT CURRENT_DATE;
ALTER TABLE tabungan_santri ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE setoran_guru ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE setoran_guru ALTER COLUMN tanggal SET DEFAULT CURRENT_DATE;
ALTER TABLE setoran_guru ALTER COLUMN created_at SET DEFAULT NOW();

-- 4. Perbaiki tabel AKADEMIK
ALTER TABLE riwayat_kelas ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE riwayat_kelas ALTER COLUMN tanggal_naik SET DEFAULT CURRENT_DATE;
ALTER TABLE riwayat_kelas ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE target_pencapaian ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE target_pencapaian ALTER COLUMN created_at SET DEFAULT NOW();

-- 5. Perbaiki tabel SISTEM
ALTER TABLE pengaturan ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pengaturan ALTER COLUMN updated_at SET DEFAULT NOW();

-- ==================================================================
-- BERHASIL: Sekarang semua fitur Tambah/Simpan harusnya normal kembali
-- ==================================================================
