-- Template materi per kelas (dipakai guru/admin saat input prestasi).
BEGIN;
CREATE TABLE IF NOT EXISTS public.materi_kelas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id   UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  urutan     INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kelas_id, nama)
);
CREATE INDEX IF NOT EXISTS idx_materi_kelas_kelas ON public.materi_kelas(kelas_id, urutan);
ALTER TABLE public.materi_kelas ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
COMMIT;
