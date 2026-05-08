# 📂 Panduan Setup Google Drive (OAuth2) untuk Aplikasi TPQ

Dokumen ini merangkum langkah-langkah untuk mengaktifkan fitur upload file (Foto, KK, Akte) menggunakan Google Drive API dengan metode OAuth2.

## 1. Setup Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat Project baru atau pilih project yang sudah ada.
3. **Aktifkan API:** Cari "Google Drive API" di Library, lalu klik **Enable (Aktifkan)**.
4. **OAuth Consent Screen:**
   - Pilih User Type: **External**.
   - Isi App Name & Email Support.
   - Di bagian **Test Users**, masukkan email Google kamu (contoh: `emailanda@gmail.com`). Klik Save.
5. **Credentials:**
   - Klik **Create Credentials** -> **OAuth client ID**.
   - Application Type: **Web Application**.
   - Nama: "Koneksi GDrive TPQ".
   - **Authorized redirect URIs:** Tambahkan `https://developers.google.com/oauthplayground`.
   - Klik Create. Simpan **Client ID** dan **Client Secret**.

## 2. Mendapatkan Refresh Token
1. Buka [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2. Klik ikon ⚙️ (Settings) di kanan atas:
   - Centang **"Use your own OAuth credentials"**.
   - Masukkan **Client ID** dan **Client Secret** kamu.
3. Di kolom pencarian Scope (Step 1):
   - Ketik/pilih `https://www.googleapis.com/auth/drive`.
   - Klik **Authorize APIs**. Login dengan akun Google kamu (Pilih "Advanced" -> "Go to ... (unsafe)" jika muncul peringatan).
4. Di Step 2:
   - Klik **Exchange authorization code for tokens**.
   - Kamu akan mendapatkan **Refresh Token**. Copy token tersebut.

## 3. Konfigurasi Environment (`.env`)
Masukkan data yang didapat ke file `.env` di folder frontend:

```env
# Google Drive Settings
GOOGLE_DRIVE_FOLDER_ID="ID_FOLDER_GDRIVE_KAMU"
GOOGLE_CLIENT_ID="XXXXX.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-XXXXX"
GOOGLE_REFRESH_TOKEN="1//0XXXXX"
```

## 4. Persiapan Database
Jalankan perintah SQL ini di Supabase untuk menambah kolom penyimpanan link file:

```sql
ALTER TABLE santri 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS kk_url TEXT,
ADD COLUMN IF NOT EXISTS akte_url TEXT;
```

## 5. Cara Penggunaan
- Sistem akan otomatis mengupload file ke Google Drive saat kamu menyimpan data Santri.
- File di Google Drive akan diatur sebagai "Public" (Anyone with link can view) agar bisa ditampilkan di web.
- Link file akan tersimpan di database Supabase secara otomatis.
