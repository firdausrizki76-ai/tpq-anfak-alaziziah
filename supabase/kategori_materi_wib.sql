-- 1) Materi per kategori prestasi (Qiraati, Doa & Tachfid)
BEGIN;
ALTER TABLE public.materi_kelas ADD COLUMN IF NOT EXISTS kategori TEXT NOT NULL DEFAULT 'Qiraati';
ALTER TABLE public.materi_kelas DROP CONSTRAINT IF EXISTS materi_kelas_kelas_id_nama_key;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materi_kelas_kelas_kategori_nama_key') THEN
    ALTER TABLE public.materi_kelas ADD CONSTRAINT materi_kelas_kelas_kategori_nama_key UNIQUE (kelas_id, kategori, nama);
  END IF;
END $$;
DROP INDEX IF EXISTS public.idx_materi_kelas_kelas;
CREATE INDEX IF NOT EXISTS idx_materi_kelas_kelas_kat ON public.materi_kelas(kelas_id, kategori, urutan);

-- 2) Kategori prestasi sementara: dua saja
UPDATE public.pengaturan SET value = '["Qiraati","Doa & Tachfid"]', updated_at = now() WHERE key = 'kategori_prestasi';
INSERT INTO public.pengaturan (key, value, updated_at)
SELECT 'kategori_prestasi', '["Qiraati","Doa & Tachfid"]', now()
WHERE NOT EXISTS (SELECT 1 FROM public.pengaturan WHERE key = 'kategori_prestasi');

-- 3) Zona waktu bawaan WIB (Magelang)
UPDATE public.kelas SET zona_waktu = 'Asia/Jakarta' WHERE zona_waktu <> 'Asia/Jakarta';
ALTER TABLE public.kelas ALTER COLUMN zona_waktu SET DEFAULT 'Asia/Jakarta';
ALTER TABLE public.shift_jadwal ALTER COLUMN zona_waktu SET DEFAULT 'Asia/Jakarta';
NOTIFY pgrst, 'reload schema';
COMMIT;
