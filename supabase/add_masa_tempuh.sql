-- Tambahkan kolom masa_tempuh ke tabel riwayat_kelas
ALTER TABLE riwayat_kelas ADD COLUMN IF NOT EXISTS masa_tempuh INTEGER;

-- Komentar: Jalankan query ini di SQL Editor Supabase untuk memperbaiki error "column masa_tempuh not found"
