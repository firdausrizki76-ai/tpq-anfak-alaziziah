-- Jalankan sekali di Supabase SQL Editor.
-- Fitur: master Shift jadwal (hari + jam), kelas memilih shift, guru non-wali punya shift sendiri,
--        target masa tempuh per kelas (untuk statistik Ujian & Kenaikan).
BEGIN;

-- 1. Master shift
CREATE TABLE IF NOT EXISTS public.shift_jadwal (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        TEXT NOT NULL,
  hari        INTEGER[] NOT NULL DEFAULT '{}',          -- 0=Minggu ... 6=Sabtu
  jam_mulai   TEXT NOT NULL,                            -- 'HH:MM'
  jam_selesai TEXT NOT NULL,                            -- 'HH:MM'
  zona_waktu  TEXT NOT NULL DEFAULT 'Asia/Makassar',
  urutan      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shift_jadwal ENABLE ROW LEVEL SECURITY;

-- 2. Kelas memilih shift (kelas.jadwal tetap menjadi salinan hasil shift agar absensi lama tetap jalan)
ALTER TABLE public.kelas ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shift_jadwal(id) ON DELETE SET NULL;
ALTER TABLE public.kelas ADD COLUMN IF NOT EXISTS target_masa_tempuh INTEGER;   -- target hari per jilid/kelas

-- 3. Guru (khususnya yang bukan wali kelas) bisa punya shift sendiri
ALTER TABLE public.guru ADD COLUMN IF NOT EXISTS shift_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.guru ADD COLUMN IF NOT EXISTS jadwal JSONB NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
COMMIT;
