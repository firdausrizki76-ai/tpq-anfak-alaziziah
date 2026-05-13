-- ============================================
-- SEED DATA — Data Awal TPQ Anfak Al Azizah
-- Jalankan SETELAH schema.sql
-- ============================================

-- =====================
-- SEED: 18 Kelas Qiraati
-- =====================
INSERT INTO kelas (kode_kelas, nama_kelas, urutan, deskripsi) VALUES
  ('PRA_A', 'PRA A', 1, 'Kelas persiapan A - pengenalan huruf'),
  ('PRA_B', 'PRA B', 2, 'Kelas persiapan B - pengenalan huruf lanjut'),
  ('PRA_C', 'PRA C', 3, 'Kelas persiapan C - dasar membaca'),
  ('TK_1C', 'TK 1C', 4, 'Tahap Qiraati Jilid 1C'),
  ('TK_2A', 'TK 2A', 5, 'Tahap Qiraati Jilid 2A'),
  ('TK_2B', 'TK 2B', 6, 'Tahap Qiraati Jilid 2B'),
  ('TK_3A', 'TK 3A', 7, 'Tahap Qiraati Jilid 3A'),
  ('TK_3B', 'TK 3B', 8, 'Tahap Qiraati Jilid 3B'),
  ('TK_4A', 'TK 4A', 9, 'Tahap Qiraati Jilid 4A'),
  ('TK_4B', 'TK 4B', 10, 'Tahap Qiraati Jilid 4B'),
  ('TK_5A', 'TK 5A', 11, 'Tahap Qiraati Jilid 5A'),
  ('TK_5B', 'TK 5B', 12, 'Tahap Qiraati Jilid 5B'),
  ('JUZ_27', 'JUZ 27', 13, 'Tahap Juz 27'),
  ('TK_6', 'TK 6', 14, 'Tahap Qiraati Jilid 6'),
  ('AL_QURAN', 'AL-QUR''AN', 15, 'Tahap Al-Quran'),
  ('GHORIB', 'GHORIB', 16, 'Tahap Ghorib'),
  ('TAJWID', 'TAJWID', 17, 'Tahap Tajwid'),
  ('FINISHING', 'FINISHING', 18, 'Tahap Finishing / menuju khatam'),
  ('KHOTAM', 'Khotam', 19, 'Kelas terakhir bagi siswa yg sudah lulus'),
  ('KELUAR', 'Siswa yang Keluar', 99, 'Siswa yang keluar sekolah dan tidak lulus')
ON CONFLICT (kode_kelas) DO NOTHING;

-- =====================
-- SEED: Jenis Pembayaran
-- =====================
INSERT INTO jenis_pembayaran (nama, kategori, nominal_default, deskripsi) VALUES
  ('Syahriah', 'bulanan', 50000, 'Iuran bulanan wajib santri'),
  ('Uang Gedung', 'insidental', 200000, 'Iuran awal masuk untuk bangunan'),
  ('Pendaftaran', 'insidental', 100000, 'Biaya pendaftaran santri baru'),
  ('Infaq', 'insidental', NULL, 'Infaq sukarela'),
  ('Kegiatan Akhir Tahun', 'kegiatan', 150000, 'Biaya kegiatan wisuda/khataman');

-- =====================
-- SEED: Pengaturan Default
-- =====================
INSERT INTO pengaturan (key, value) VALUES
  ('nama_lembaga', 'TPQ Anfak Al Azizah'),
  ('alamat', 'Tepus Wetan, Surodadi, Candimulyo, Magelang'),
  ('no_telepon', '081234567890'),
  ('email', 'admin@tpqanfakalazizah.com'),
  ('nominal_syahriah', '50000'),
  ('tahun_ajaran', '2025/2026')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- SEED: Guru Contoh
-- =====================
INSERT INTO guru (nip, nama_lengkap, jenis_kelamin, jabatan, no_hp, email, alamat, status) VALUES
  ('G001', 'Ust. Siti Fatimah', 'P', 'Koordinator', '081234567890', 'fatimah@tpq.com', 'Tepus Wetan RT 01/02', 'aktif'),
  ('G002', 'Ust. Aminah', 'P', 'Wali Kelas', '081234567891', 'aminah@tpq.com', 'Surodadi RT 03/01', 'aktif'),
  ('G003', 'Ust. Khadijah', 'P', 'Wali Kelas', '081234567892', 'khadijah@tpq.com', 'Candimulyo RT 02/04', 'aktif'),
  ('G004', 'Ust. Budi Santoso', 'L', 'Wali Kelas', '081234567893', 'budi@tpq.com', 'Tepus Wetan RT 04/02', 'aktif'),
  ('G005', 'Ust. Ahmad Fauzi', 'L', 'Wali Kelas', '081234567894', 'ahmad@tpq.com', 'Surodadi RT 01/03', 'aktif');
