-- ============================================
-- SETUP AUTENTIKASI & ROW LEVEL SECURITY (RLS)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambahkan kolom password untuk Guru dan Santri (Default password bisa diatur dari backend, tapi kita siapkan kolomnya)
ALTER TABLE guru ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'guru123';
ALTER TABLE santri ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'siswa123';

-- 2. Tambahkan pengaturan password admin default jika belum ada
INSERT INTO pengaturan (key, value) VALUES ('admin_username', 'admin'), ('admin_password', 'admin123')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- AKTIFKAN RLS (ROW LEVEL SECURITY)
-- ============================================
-- Karena kita menggunakan Backend Express dengan Service Role Key, backend memiliki akses penuh.
-- RLS ini bertujuan untuk mengamankan database dari akses langsung menggunakan Anon Key (Public).

-- Aktifkan RLS di semua tabel
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabungan_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_pencapaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;

-- Buat Policy: Service Role (Backend) diizinkan penuh, Anon (Publik) ditolak
-- Kelas
CREATE POLICY "Service Role Full Access Kelas" ON kelas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Kelas" ON kelas FOR ALL TO anon USING (false);

-- Guru
CREATE POLICY "Service Role Full Access Guru" ON guru FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Guru" ON guru FOR ALL TO anon USING (false);

-- Santri
CREATE POLICY "Service Role Full Access Santri" ON santri FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Santri" ON santri FOR ALL TO anon USING (false);

-- Absensi
CREATE POLICY "Service Role Full Access Absensi" ON absensi FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Absensi" ON absensi FOR ALL TO anon USING (false);

-- Jenis Pembayaran
CREATE POLICY "Service Role Full Access Jenis Pembayaran" ON jenis_pembayaran FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Jenis Pembayaran" ON jenis_pembayaran FOR ALL TO anon USING (false);

-- Pembayaran
CREATE POLICY "Service Role Full Access Pembayaran" ON pembayaran FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Pembayaran" ON pembayaran FOR ALL TO anon USING (false);

-- Tabungan Santri
CREATE POLICY "Service Role Full Access Tabungan" ON tabungan_santri FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Tabungan" ON tabungan_santri FOR ALL TO anon USING (false);

-- Riwayat Kelas
CREATE POLICY "Service Role Full Access Riwayat Kelas" ON riwayat_kelas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Riwayat Kelas" ON riwayat_kelas FOR ALL TO anon USING (false);

-- Target Pencapaian
CREATE POLICY "Service Role Full Access Target Pencapaian" ON target_pencapaian FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Target Pencapaian" ON target_pencapaian FOR ALL TO anon USING (false);

-- Pengaturan
CREATE POLICY "Service Role Full Access Pengaturan" ON pengaturan FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon Deny Pengaturan" ON pengaturan FOR ALL TO anon USING (false);
