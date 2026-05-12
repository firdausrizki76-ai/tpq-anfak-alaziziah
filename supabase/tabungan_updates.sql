-- ============================================
-- SQL UPDATE SCRIPT FOR TABUNGAN & UJIAN
-- ============================================

-- 1. ADD guru_id TO tabungan_santri
ALTER TABLE tabungan_santri 
ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES guru(id) ON DELETE SET NULL;

-- 2. CREATE setoran_guru TABLE
CREATE TABLE IF NOT EXISTS setoran_guru (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id         UUID REFERENCES guru(id) ON DELETE CASCADE NOT NULL,
  nominal         BIGINT NOT NULL,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan      TEXT,
  status          VARCHAR(20) DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'diterima', 'ditolak')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VIEW FOR REKAP GURU (Saldo yang dipegang guru dan belum disetor)
CREATE OR REPLACE VIEW v_rekap_guru_tabungan AS
WITH collected AS (
  SELECT 
    recorded_by AS guru_id,
    SUM(CASE WHEN jenis = 'setor' THEN nominal ELSE 0 END) AS total_koleksi,
    SUM(CASE WHEN jenis = 'tarik' THEN nominal ELSE 0 END) AS total_tarik
  FROM tabungan_santri
  WHERE recorded_by IS NOT NULL
  GROUP BY recorded_by
),
deposited AS (
  SELECT 
    guru_id,
    SUM(nominal) AS total_setoran
  FROM setoran_guru
  WHERE status = 'diterima'
  GROUP BY guru_id
)
SELECT 
  g.id AS guru_id,
  g.nama_lengkap AS nama_guru,
  COALESCE(c.total_koleksi, 0) AS total_koleksi,
  COALESCE(c.total_tarik, 0) AS total_tarik,
  COALESCE(d.total_setoran, 0) AS total_setoran,
  (COALESCE(c.total_koleksi, 0) - COALESCE(c.total_tarik, 0) - COALESCE(d.total_setoran, 0)) AS saldo_di_guru
FROM guru g
LEFT JOIN collected c ON g.id = c.guru_id
LEFT JOIN deposited d ON g.id = d.guru_id;

-- 4. VIEW FOR REKAP ADMIN (Total saldo yang sudah masuk ke pusat)
CREATE OR REPLACE VIEW v_rekap_admin_tabungan AS
SELECT 
  SUM(nominal) AS total_dana_masuk,
  COUNT(id) AS jumlah_transaksi
FROM setoran_guru
WHERE status = 'diterima';

-- 5. UPDATE TARGET PENCAPAIAN FOR MORE FLEXIBILITY
ALTER TABLE target_pencapaian
ADD COLUMN IF NOT EXISTS nomor_tes VARCHAR(50);
