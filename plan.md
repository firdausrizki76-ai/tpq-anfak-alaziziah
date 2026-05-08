📋 PLAN LENGKAP — Sistem Administrasi Digital TPQ
Berikut plan lengkap yang bisa langsung kamu copy ke project. Saya susun secara sistematis dari arsitektur, struktur folder, skema database, hingga roadmap pengembangan.

🏗️ ARSITEKTUR SISTEM
┌─────────────────────────────────────────────────────────┐
│                    USER / BROWSER                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              VERCEL (Frontend + Backend)                  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │   React.js + Vite   │  │  Vercel Serverless Func  │  │
│  │   (UI/Frontend)     │  │  Express.js API Routes   │  │
│  └─────────────────────┘  └──────────────┬───────────┘  │
└──────────────────────────────────────────┼──────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────┐
│                    SUPABASE (BaaS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL  │  │     Auth     │  │    Storage    │  │
│  │  (Database)  │  │  (JWT Login) │  │ (Foto/Dokumen)│  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘

📁 STRUKTUR FOLDER PROJECT
tpq-admin/
├── frontend/                          # React.js + Vite
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/               # Komponen reusable
│   │   │   ├── ui/                   # Button, Input, Modal, Card, dll
│   │   │   ├── layout/               # Sidebar, Navbar, PageWrapper
│   │   │   └── shared/               # DataTable, Badge, Avatar, dll
│   │   ├── pages/                    # Halaman utama per modul
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── santri/
│   │   │   │   ├── DaftarSantri.jsx
│   │   │   │   ├── DetailSantri.jsx
│   │   │   │   ├── TambahSantri.jsx
│   │   │   │   └── EditSantri.jsx
│   │   │   ├── guru/
│   │   │   │   ├── DaftarGuru.jsx
│   │   │   │   ├── DetailGuru.jsx
│   │   │   │   └── TambahGuru.jsx
│   │   │   ├── kelas/
│   │   │   │   ├── DaftarKelas.jsx
│   │   │   │   ├── DetailKelas.jsx
│   │   │   │   └── KenaikanKelas.jsx
│   │   │   ├── absensi/
│   │   │   │   ├── ScanAbsensi.jsx       # Halaman scan QR (untuk guru)
│   │   │   │   ├── GenerateQR.jsx        # Admin generate QR massal
│   │   │   │   ├── RiwayatAbsensi.jsx
│   │   │   │   └── RekapAbsensi.jsx
│   │   │   ├── pembayaran/
│   │   │   │   ├── Syahriah.jsx
│   │   │   │   ├── TabunganWajib.jsx
│   │   │   │   ├── PembayaranLain.jsx    # Infak, daftar ulang, dll
│   │   │   │   └── RiwayatPembayaran.jsx
│   │   │   ├── tabungan/
│   │   │   │   ├── TabunganHarian.jsx    # Per wali kelas
│   │   │   │   ├── RekapTabungan.jsx
│   │   │   │   └── PenarikanTabungan.jsx
│   │   │   └── laporan/
│   │   │       ├── LaporanKeuangan.jsx
│   │   │       ├── LaporanAbsensi.jsx
│   │   │       └── LaporanPerkembangan.jsx
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSantri.js
│   │   │   └── useAbsensi.js
│   │   ├── services/                 # API calls ke backend
│   │   │   ├── api.js                # Axios instance + interceptor
│   │   │   ├── santriService.js
│   │   │   ├── guruService.js
│   │   │   ├── absensiService.js
│   │   │   ├── pembayaranService.js
│   │   │   └── tabunganService.js
│   │   ├── store/                    # State management (Zustand/Context)
│   │   │   ├── authStore.js
│   │   │   └── appStore.js
│   │   ├── utils/
│   │   │   ├── constants.js          # DAFTAR_KELAS, dll
│   │   │   ├── formatters.js         # Format tanggal, mata uang
│   │   │   └── validators.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── router.jsx                # React Router config
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                          # Express.js → Vercel Serverless
│   ├── api/                          # Entry point Vercel
│   │   └── index.js                  # Main Express app
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── santri.routes.js
│   │   ├── guru.routes.js
│   │   ├── kelas.routes.js
│   │   ├── absensi.routes.js
│   │   ├── pembayaran.routes.js
│   │   └── tabungan.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── santri.controller.js
│   │   ├── guru.controller.js
│   │   ├── kelas.controller.js
│   │   ├── absensi.controller.js
│   │   ├── pembayaran.controller.js
│   │   └── tabungan.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js        # Verifikasi JWT Supabase
│   │   ├── role.middleware.js        # RBAC: admin, guru, wali_kelas
│   │   └── upload.middleware.js      # Handle file upload
│   ├── config/
│   │   └── supabase.js               # Supabase client init
│   ├── utils/
│   │   └── response.js               # Standard API response helper
│   ├── vercel.json                   # Vercel routing config
│   └── package.json
│
└── database/
    ├── schema.sql                    # DDL lengkap semua tabel
    ├── seed.sql                      # Data awal (kelas, dll)
    └── migrations/                   # Perubahan skema bertahap
        └── 001_initial.sql

🗄️ SKEMA DATABASE (PostgreSQL — Supabase)
Tabel Referensi Kelas
sql-- Master 19 kelas Qiraati
CREATE TABLE kelas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_kelas    VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 'PRA_A', 'TK_1C'
  nama_kelas    VARCHAR(50) NOT NULL,          -- e.g. 'PRA A', 'TK 1C'
  urutan        SMALLINT NOT NULL,             -- 1-19 untuk sorting
  deskripsi     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 19 kelas:
-- 1=PRA A, 2=PRA B, 3=PRA C,
-- 4=TK 1C, 5=TK 2A, 6=TK 2B,
-- 7=TK 3A, 8=TK 3B, 9=TK 4A, 10=TK 4B,
-- 11=TK 5A, 12=TK 5B, 13=JUZ 27,
-- 14=TK 6, 15=AL-QUR'AN, 16=GHORIB,
-- 17=TAJWID, 18=FINISHING, (19=LULUS/KHATAM)
Tabel Pengguna & Role
sql-- Sinkron dengan Supabase Auth
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  nama_lengkap  VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin','guru','wali_kelas')),
  no_hp         VARCHAR(20),
  foto_url      TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
Tabel Santri
sqlCREATE TABLE santri (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_induk       VARCHAR(20) UNIQUE NOT NULL,   -- NIS otomatis
  nama_lengkap      VARCHAR(100) NOT NULL,
  nama_panggilan    VARCHAR(50),
  jenis_kelamin     CHAR(1) CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir      VARCHAR(100),
  tanggal_lahir     DATE,
  alamat            TEXT,
  nama_ayah         VARCHAR(100),
  nama_ibu          VARCHAR(100),
  no_hp_wali        VARCHAR(20),
  nama_wali         VARCHAR(100),
  status            VARCHAR(20) DEFAULT 'aktif'
                    CHECK (status IN ('aktif','nonaktif','lulus','pindah')),

  -- Kelas saat ini
  kelas_id          UUID REFERENCES kelas(id),
  wali_kelas_id     UUID REFERENCES users(id),

  -- Dokumen (Supabase Storage URL)
  foto_url          TEXT,
  scan_akta_url     TEXT,
  scan_kk_url       TEXT,

  -- Metadata pendaftaran
  tanggal_daftar    DATE DEFAULT CURRENT_DATE,
  tanggal_lulus     DATE,
  tahun_ajaran      VARCHAR(10),                   -- e.g. '2024/2025'

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
Tabel Guru
sqlCREATE TABLE guru (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  nip             VARCHAR(30) UNIQUE,
  nama_lengkap    VARCHAR(100) NOT NULL,
  jenis_kelamin   CHAR(1) CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir    VARCHAR(100),
  tanggal_lahir   DATE,
  alamat          TEXT,
  no_hp           VARCHAR(20),
  jabatan         VARCHAR(50),                    -- Musyrif, Koordinator, dll
  foto_url        TEXT,
  status          VARCHAR(20) DEFAULT 'aktif',
  tanggal_masuk   DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
Tabel Rombel (Kelas Aktif per Tahun Ajaran)
sqlCREATE TABLE rombel (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id        UUID REFERENCES kelas(id),
  wali_kelas_id   UUID REFERENCES guru(id),
  tahun_ajaran    VARCHAR(10) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
Tabel Absensi
sqlCREATE TABLE absensi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_scan      TIMESTAMPTZ DEFAULT NOW(),

  -- Tipe: santri atau guru
  tipe            VARCHAR(10) CHECK (tipe IN ('santri','guru')),
  santri_id       UUID REFERENCES santri(id),
  guru_id         UUID REFERENCES guru(id),

  status          VARCHAR(20) DEFAULT 'hadir'
                  CHECK (status IN ('hadir','sakit','izin','alfa')),
  keterangan      TEXT,
  di_scan_oleh    UUID REFERENCES users(id),   -- guru yang scan

  CONSTRAINT chk_subject CHECK (
    (tipe='santri' AND santri_id IS NOT NULL AND guru_id IS NULL) OR
    (tipe='guru'   AND guru_id IS NOT NULL AND santri_id IS NULL)
  )
);

-- Index untuk query cepat per tanggal
CREATE INDEX idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX idx_absensi_santri ON absensi(santri_id, tanggal);
Tabel Pembayaran
sql-- Jenis pembayaran yang bisa dikonfigurasi admin
CREATE TABLE jenis_pembayaran (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            VARCHAR(100) NOT NULL,  -- 'Syahriah', 'Tabungan Wajib', dll
  kategori        VARCHAR(30)
                  CHECK (kategori IN ('bulanan','insidental','kegiatan')),
  nominal_default BIGINT,                 -- Bisa di-override per transaksi
  adalah_hak_santri BOOLEAN DEFAULT FALSE, -- TRUE = Tabungan Wajib
  deskripsi       TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Transaksi pembayaran
CREATE TABLE pembayaran (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id           UUID REFERENCES santri(id) NOT NULL,
  jenis_pembayaran_id UUID REFERENCES jenis_pembayaran(id) NOT NULL,

  -- Periode (untuk pembayaran bulanan)
  bulan               SMALLINT CHECK (bulan BETWEEN 1 AND 12),
  tahun               SMALLINT,
  tahun_ajaran        VARCHAR(10),

  nominal             BIGINT NOT NULL,
  tanggal_bayar       DATE DEFAULT CURRENT_DATE,
  metode_bayar        VARCHAR(30) DEFAULT 'tunai'
                      CHECK (metode_bayar IN ('tunai','transfer','tabungan')),
  status              VARCHAR(20) DEFAULT 'lunas'
                      CHECK (status IN ('lunas','cicil','belum')),
  catatan             TEXT,
  dicatat_oleh        UUID REFERENCES users(id),

  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_pembayaran_santri ON pembayaran(santri_id);
CREATE INDEX idx_pembayaran_periode ON pembayaran(tahun, bulan);
Tabel Tabungan Santri (Tabungan Harian)
sqlCREATE TABLE tabungan_santri (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) NOT NULL,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis           VARCHAR(10) CHECK (jenis IN ('setor','tarik','pakai')),
                  -- 'pakai' = digunakan untuk bayar syahriah, dll
  nominal         BIGINT NOT NULL,
  saldo_setelah   BIGINT NOT NULL,          -- Snapshot saldo setelah transaksi
  keterangan      TEXT,                     -- e.g. 'Bayar Syahriah Oktober'
  dicatat_oleh    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- View saldo tabungan (real-time)
CREATE VIEW v_saldo_tabungan AS
  SELECT
    santri_id,
    SUM(CASE WHEN jenis='setor' THEN nominal ELSE 0 END) AS total_setor,
    SUM(CASE WHEN jenis IN ('tarik','pakai') THEN nominal ELSE 0 END) AS total_keluar,
    SUM(CASE WHEN jenis='setor' THEN nominal ELSE -nominal END) AS saldo
  FROM tabungan_santri
  GROUP BY santri_id;
Tabel Perkembangan Kelas (Kenaikan Kelas Akselerasi)
sqlCREATE TABLE riwayat_kelas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) NOT NULL,
  kelas_dari_id   UUID REFERENCES kelas(id),
  kelas_ke_id     UUID REFERENCES kelas(id) NOT NULL,
  tanggal_naik    DATE DEFAULT CURRENT_DATE,
  status_tes      VARCHAR(20) DEFAULT 'lulus'
                  CHECK (status_tes IN ('lulus','remidi','lulus_bersyarat')),
  nilai_tes       SMALLINT,
  penguji_id      UUID REFERENCES guru(id),
  catatan         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk tracking target pencapaian
CREATE TABLE target_pencapaian (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id       UUID REFERENCES santri(id) NOT NULL,
  kelas_id        UUID REFERENCES kelas(id) NOT NULL,
  target_hari     SMALLINT,               -- Target hari tempuh di kelas ini
  aktual_hari     SMALLINT,               -- Diisi otomatis saat naik kelas
  tanggal_masuk   DATE,
  tanggal_selesai DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

🎨 MODUL UI — HALAMAN & KOMPONEN
1. Layout Utama
┌─────────────────────────────────────────────────────────┐
│  NAVBAR  [Logo TPQ] [Notifikasi] [Avatar User ▼]        │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │           CONTENT AREA                      │
│          │                                              │
│ 📊 Dashboard          ← Halaman aktif                  │
│ 👤 Santri                                              │
│ 👩‍🏫 Guru                                               │
│ 🏫 Kelas                                               │
│ ✅ Absensi                                              │
│ 💰 Pembayaran                                          │
│ 🏦 Tabungan                                            │
│ 📈 Laporan                                             │
│ ⚙️  Pengaturan                                         │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
2. Halaman Dashboard
KARTU STATISTIK (4 kolom):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Santri │ │ Hadir Hari   │ │ Tunggakan    │ │ Total        │
│    aktif     │ │    Ini       │ │  Syahriah    │ │  Tabungan    │
│     248      │ │  201 / 248   │ │  Rp 2.4jt   │ │  Rp 45jt    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

GRAFIK BARIS (2 kolom):
┌──────────────────────────┐ ┌──────────────────────────┐
│  Tren Kehadiran 30 Hari  │ │   Distribusi Santri      │
│  (Line Chart)            │ │   per Kelas (Bar Chart)  │
└──────────────────────────┘ └──────────────────────────┘

TABEL AKTIVITAS TERBARU:
┌─────────────────────────────────────────────────────────┐
│  Aktivitas Terbaru (Pembayaran, Absensi, Naik Kelas)   │
└─────────────────────────────────────────────────────────┘
3. Halaman Santri
[+ Tambah Santri] [🔍 Cari...] [Filter Kelas ▼] [Export Excel]

TABEL SANTRI:
┌────┬──────────────┬─────┬──────────┬──────────┬────────┬────────┐
│ No │ Nama Lengkap │ NIS │  Kelas   │ Wali     │ Status │  Aksi  │
├────┼──────────────┼─────┼──────────┼──────────┼────────┼────────┤
│  1 │ Ahmad Fauzi  │ 001 │ TK 3A    │ Pak Budi │ Aktif  │ 👁 ✏ 🗑 │
└────┴──────────────┴─────┴──────────┴──────────┴────────┴────────┘
                                                    Paginasi: < 1 2 3 >

DETAIL SANTRI (drawer/halaman terpisah):
Tab: [Data Diri] [Dokumen] [Riwayat Kelas] [Pembayaran] [Tabungan] [Absensi]
4. Halaman Absensi — Scan QR
MODE GURU (Scan Santri):
┌─────────────────────────────────────────────────────────┐
│            📷  AREA SCAN QR CODE                        │
│        (Kamera aktif, frame tanda QR)                   │
│                                                         │
│  ✅ Ahmad Fauzi — TK 3A — HADIR  09:04                  │
│  ✅ Siti Aminah — TK 3A — HADIR  09:05                  │
└─────────────────────────────────────────────────────────┘
│  Tanggal: Senin, 2 Juni 2025  │  Kelas: TK 3A          │
│  Sudah Hadir: 18 / 25         │  [Lihat Rekap]          │

GENERATE QR MASSAL (Admin):
┌─────────────────────────────────────────────────────────┐
│  Filter: [Semua Kelas ▼]  [Semua Santri ▼]             │
│  [🖨 Print QR Massal]  [📥 Download ZIP]                │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  QR+Foto │ │  QR+Foto │ │  QR+Foto │  ← ID Card    │
│  │  Ahmad F │ │  Siti A  │ │  Budi S  │    Preview     │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────┘
5. Halaman Pembayaran
Tab: [Syahriah] [Tabungan Wajib] [Pembayaran Lain]

SYAHRIAH — Bulan Oktober 2025:
[Bulan ▼] [Tahun ▼] [Kelas ▼]  [+ Catat Bayar]

┌──────────────┬──────────┬──────────┬────────┬──────────┐
│ Nama Santri  │  Kelas   │ Nominal  │ Status │   Aksi   │
├──────────────┼──────────┼──────────┼────────┼──────────┤
│ Ahmad Fauzi  │ TK 3A    │ Rp 75rb  │ ✅Lunas│ Lihat    │
│ Siti Aminah  │ TK 3A    │ Rp 75rb  │ ❌Blm  │ Bayar    │
└──────────────┴──────────┴──────────┴────────┴──────────┘

RINGKASAN:
Terkumpul: Rp 3.750.000 / Rp 5.000.000  (75%)
6. Halaman Tabungan Santri
REKAP TABUNGAN — Kelas TK 3A (Wali Kelas: Bu Fatimah)
[Tanggal: ___] [+ Catat Setoran Hari Ini]

┌──────────────┬──────────────┬────────────┬──────────┬────────┐
│ Nama Santri  │ Total Setor  │ Total Pakai│  Saldo   │  Aksi  │
├──────────────┼──────────────┼────────────┼──────────┼────────┤
│ Ahmad Fauzi  │ Rp 250.000   │ Rp 75.000  │ Rp 175rb │ Detail │
└──────────────┴──────────────┴────────────┴──────────┴────────┘

INPUT SETORAN CEPAT (per hari):
┌──────────────┬──────────────────┐
│ Nama Santri  │ Nominal Setor    │
├──────────────┼──────────────────┤
│ Ahmad Fauzi  │ [      5000    ] │
│ Siti Aminah  │ [      2000    ] │
└──────────────┴──────────────────┘
                            [Simpan Semua]
7. Halaman Kelas & Kenaikan
DAFTAR SANTRI PER KELAS:
Kelas: TK 3A  │  Wali Kelas: Bu Fatimah  │  Jumlah: 25 santri

┌──────────────┬──────────┬───────────┬────────────┬────────────┐
│ Nama Santri  │ Tgl Masuk│ Target Hr │ Hari Tempuh│    Aksi    │
│              │ di Kelas │           │ (aktual)   │            │
├──────────────┼──────────┼───────────┼────────────┼────────────┤
│ Ahmad Fauzi  │ 10 Agt   │  60 hari  │   45 hari  │ [Naik Kls] │
└──────────────┴──────────┴───────────┴────────────┴────────────┘

MODAL KENAIKAN KELAS:
┌─────────────────────────────────────────────────┐
│  🎓 Kenaikan Kelas — Ahmad Fauzi               │
│  Dari: TK 3A  →  Ke: [TK 3B ▼]                │
│  Status Tes: [Lulus ▼]   Nilai: [___]           │
│  Penguji: [Pilih Guru ▼]                        │
│  Catatan: [________________________]            │
│                    [Batal] [Simpan & Naik Kelas] │
└─────────────────────────────────────────────────┘

🔐 SISTEM ROLE & AKSES
FiturAdminGuruWali KelasKelola Data Santri✅👁👁 (kelas sendiri)Kelola Data Guru✅👁❌Generate QR Massal✅❌❌Scan Absensi✅✅✅Catat Pembayaran Syahriah✅❌❌Catat Tabungan Harian✅❌✅ (kelas sendiri)Kenaikan Kelas✅✅❌Laporan Keuangan✅❌❌Pengaturan Sistem✅❌❌

📦 TECH STACK & DEPENDENCIES
Frontend (frontend/package.json)
json{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^4.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "recharts": "^2.x",
    "html5-qrcode": "^2.x",
    "qrcode": "^1.x",
    "react-to-print": "^2.x",
    "date-fns": "^3.x",
    "react-hot-toast": "^2.x",
    "lucide-react": "^0.x",
    "@tanstack/react-table": "^8.x",
    "react-select": "^5.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x"
  }
}
Backend (backend/package.json)
json{
  "dependencies": {
    "express": "^4.x",
    "@supabase/supabase-js": "^2.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "multer": "^1.x",
    "jsonwebtoken": "^9.x",
    "express-validator": "^7.x",
    "helmet": "^7.x"
  }
}

⚙️ KONFIGURASI VERCEL
backend/vercel.json
json{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.js"
    }
  ]
}
Environment Variables (.env)
env# Supabase
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxx  # Hanya di backend!

# App
JWT_SECRET=your_secret_key
FRONTEND_URL=https://tpq-admin.vercel.app
NODE_ENV=production

🗺️ API ROUTES
AUTH
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

SANTRI
  GET    /api/santri              → List + filter + pagination
  POST   /api/santri              → Tambah santri baru
  GET    /api/santri/:id          → Detail santri
  PUT    /api/santri/:id          → Update data santri
  DELETE /api/santri/:id          → Nonaktifkan santri
  POST   /api/santri/:id/upload   → Upload foto/dokumen

GURU
  GET    /api/guru
  POST   /api/guru
  GET    /api/guru/:id
  PUT    /api/guru/:id

KELAS
  GET    /api/kelas               → Master 19 kelas
  GET    /api/kelas/:id/santri    → Santri per kelas
  POST   /api/kelas/naik          → Proses kenaikan kelas
  GET    /api/kelas/:id/progress  → Target vs aktual per santri

ABSENSI
  GET    /api/absensi             → Rekap (filter tgl, kelas)
  POST   /api/absensi/scan        → Catat absensi via QR scan
  POST   /api/absensi/manual      → Input manual
  GET    /api/absensi/qr/:santriId → Generate QR token santri
  GET    /api/absensi/generate-batch → QR massal (admin)

PEMBAYARAN
  GET    /api/pembayaran          → List transaksi
  POST   /api/pembayaran          → Catat pembayaran
  GET    /api/pembayaran/tagihan  → Cek tunggakan per bulan
  GET    /api/pembayaran/rekap    → Rekap per bulan/tahun

TABUNGAN
  GET    /api/tabungan/:santriId         → Riwayat tabungan santri
  GET    /api/tabungan/saldo/:santriId   → Saldo aktual
  POST   /api/tabungan/setor             → Catat setoran
  POST   /api/tabungan/tarik             → Penarikan
  GET    /api/tabungan/rekap-kelas/:kelasId → Rekap per kelas

LAPORAN
  GET    /api/laporan/keuangan           → Summary keuangan
  GET    /api/laporan/absensi            → Rekap absensi bulanan
  GET    /api/laporan/perkembangan       → Progress santri per kelas

🚀 ROADMAP PENGEMBANGAN
FASE 1 — UI PROTOTYPING (Browser-only, no backend)

Tujuan: Semua halaman bisa diklik, pakai mock data

✅ Setup project Vite + React + Tailwind
✅ Komponen UI dasar (Button, Input, Modal, Table, Badge)
✅ Layout: Sidebar + Navbar + Routing
✅ Halaman: Dashboard (statistik & chart statis)
✅ Halaman: Daftar Santri + Form Tambah/Edit
✅ Halaman: Daftar Guru
✅ Halaman: Kelas & Kenaikan Kelas
✅ Halaman: Absensi (scan QR + generate QR)
✅ Halaman: Pembayaran Syahriah & Tabungan Wajib
✅ Halaman: Tabungan Harian (per wali kelas)
✅ Halaman: Laporan
✅ Halaman: Login
FASE 2 — SETUP DATABASE & BACKEND
⬜ Setup project Supabase (PostgreSQL + Auth + Storage)
⬜ Jalankan schema.sql di Supabase SQL Editor
⬜ Seed data: 19 kelas, user admin awal
⬜ Setup backend Express.js
⬜ Konfigurasi Supabase client di backend
⬜ Implementasi Auth middleware (JWT)
⬜ CRUD API: Santri, Guru, Kelas
⬜ API Absensi + logika QR scan
⬜ API Pembayaran
⬜ API Tabungan
⬜ Deploy backend ke Vercel
FASE 3 — INTEGRASI FRONTEND ↔ BACKEND
⬜ Hubungkan semua service API ke halaman UI
⬜ Implementasi upload dokumen ke Supabase Storage
⬜ Sistem login real (Supabase Auth)
⬜ RBAC — tampilkan menu sesuai role
⬜ Real-time update absensi (Supabase Realtime)
⬜ Notifikasi toast & error handling
⬜ Loading states & skeleton screens
FASE 4 — FITUR LANJUTAN & POLISHING
⬜ Export laporan ke PDF/Excel
⬜ Print ID Card + QR Code (batch)
⬜ Dashboard grafik dinamis dari data real
⬜ Filter & pagination semua tabel
⬜ PWA (bisa install di HP guru/admin)
⬜ Dark mode
⬜ Testing & bug fixing
⬜ Deploy final ke Vercel (custom domain)

🎯 KONVENSI KODE
javascript// Naming Convention
PascalCase   → Komponen React         (DaftarSantri.jsx)
camelCase    → Functions, variables   (handleSubmit, santriData)
SCREAMING    → Constants              (DAFTAR_KELAS, API_URL)
kebab-case   → File non-komponen      (santri-service.js)

// Struktur Response API (Standard)
{
  "success": true,
  "message": "Data berhasil disimpan",
  "data": { ... },
  "meta": {             // Untuk list/pagination
    "total": 248,
    "page": 1,
    "limit": 20
  }
}

// Error Response
{
  "success": false,
  "message": "Santri tidak ditemukan",
  "errors": [ ... ]    // Opsional, untuk validasi form
}

📌 CATATAN PENTING
1. QR CODE ABSENSI
   - QR berisi: santriId + hash secret (bukan data plain)
   - QR di-generate sekali, tidak berubah (embedded di ID card fisik)
   - Backend verifikasi hash saat scan

2. TABUNGAN vs PEMBAYARAN
   - Tabungan Wajib (bulanan) = masuk ke akun "tabungan_wajib" santri
     → Hanya bisa ditarik saat lulus, bukan lewat tabungan harian
   - Tabungan Harian = uang saku santri, bisa digunakan bayar syahriah
   - Syahriah dibayar = bisa tunai ATAU potong saldo tabungan harian

3. KENAIKAN KELAS AKSELERASI
   - Tidak ada jadwal kenaikan kelas tetap
   - Guru input "siap tes" → proses tes → jika lulus → langsung naik
   - Sistem mencatat berapa hari santri di tiap kelas (aktual vs target)

4. SUPABASE STORAGE BUCKET
   - "santri-documents" → akta, KK (private, hanya admin)
   - "santri-photos"    → pas foto (public URL untuk tampilan)
   - "guru-photos"      → foto guru (public)

Silakan mulai dari Fase 1 — setup UI dulu. Kalau sudah siap atau ada yang mau didiskusikan lebih detail (skema tabel spesifik, flow absensi QR, atau desain halaman tertentu), langsung tanya di sini! 🚀