import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to convert empty strings or "null"/"undefined" strings to null
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (req.body[key] === '' || req.body[key] === 'null' || req.body[key] === 'undefined') {
        req.body[key] = null;
      }
    }
  }
  next();
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const isServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`[DB] Initializing Supabase: ${supabaseUrl}`);
console.log(`[DB] Using Service Role Key: ${isServiceKey}`);

const supabase = createClient(supabaseUrl, supabaseKey);

import jwt from 'jsonwebtoken';
import multer from 'multer';
import { uploadToGDrive } from './gdrive.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tpq_key_2026';

// Konfigurasi Multer untuk menyimpan file di memory (sebelum dikirim ke GDrive)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB per file
});

// Helper response
const ok = (res, data, msg = 'Success') => res.json({ success: true, message: msg, data });
const fail = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });

// ==================== AUTHENTICATION ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, username, password } = req.body;
    
    // 1. Logic khusus Admin & Kepala Lembaga
    if (role === 'admin') {
      const { data: userAccount } = await supabase.from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (userAccount) {
        console.log('[AUTH] Login Success (Table users) for:', userAccount.nama_lengkap);
        return ok(res, { token: 'admin-token', user: { ...userAccount, role: userAccount.role } });
      }

      const { data: user } = await supabase.from('pengaturan').select('value').eq('key', 'admin_username').single();
      const { data: pass } = await supabase.from('pengaturan').select('value').eq('key', 'admin_password').single();
      
      if (user?.value === username && pass?.value === password) {
        console.log('[AUTH] Login Success (Legacy) for: Administrator');
        return ok(res, { token: 'admin-token', user: { nama_lengkap: 'Administrator', role: 'admin', username: username } });
      }
      return fail(res, 'Username atau password salah', 401);
    }

    // 2. Logic untuk Guru / Siswa
    let table = role === 'guru' ? 'guru' : 'santri';
    let idField = role === 'guru' ? 'nip' : 'nomor_induk';

    console.log(`[AUTH] Login attempt - Role: ${role}, Username: ${username}, Table: ${table}, Field: ${idField}`);
    
    const { data, error } = await supabase.from(table)
      .select('*')
      .ilike(idField, username)
      .eq('password', password)
      .single();

    if (error) {
      console.error('[AUTH] Supabase Login Error:', error.message, error.code);
      // Jika error code PGRST116 artinya data tidak ditemukan
      if (error.code === 'PGRST116') {
        return fail(res, 'Username atau password salah (Data tidak ditemukan)', 401);
      }
      return fail(res, `Database Error: ${error.message}`, 401);
    }
    
    if (!data) {
      console.log('[AUTH] Login Failed: User not found in table');
      return fail(res, 'Username atau password salah', 401);
    }

    console.log('[AUTH] Login Success for:', data.nama_lengkap);
    ok(res, { token: 'user-token', user: { ...data, role } });
  } catch (e) { 
    console.error('Catch Error:', e.message);
    fail(res, e.message, 500); 
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { role, id, oldPassword, newPassword } = req.body;
    let table = role === 'guru' ? 'guru' : 'santri';

    // 1. Verifikasi password lama
    const { data, error } = await supabase.from(table)
      .select('id, password')
      .eq('id', id)
      .eq('password', oldPassword)
      .single();

    if (error || !data) {
      return fail(res, 'Password lama salah', 401);
    }

    // 2. Update password baru
    const { error: updateError } = await supabase.from(table)
      .update({ password: newPassword })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Update di Supabase Auth (jika email tersedia)
    // Untuk mempermudah, kita fokus di database table dulu karena login utama pakai database table
    
    ok(res, null, 'Password berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [santriRes, hadirRes, tunggakanRes, tabunganRes, trendDataRes, kelasRes, santriDistRes, guruRes, hadirGuruRes] = await Promise.all([
      supabase.from('santri').select('id', { count: 'exact' }),
      supabase.from('absensi').select('id', { count: 'exact' }).eq('tanggal', today).eq('status', 'hadir').eq('tipe', 'santri'),
      supabase.from('pembayaran').select('nominal').eq('status', 'belum'),
      supabase.from('v_saldo_tabungan').select('saldo'),
      supabase.from('absensi').select('tanggal').eq('tipe', 'santri').eq('status', 'hadir').gte('tanggal', thirtyDaysAgo.toISOString().split('T')[0]),
      supabase.from('kelas').select('id, nama_kelas'),
      supabase.from('santri').select('kelas_id'),
      supabase.from('guru').select('id', { count: 'exact' }).eq('status', 'aktif'),
      supabase.from('absensi').select('id', { count: 'exact' }).eq('tanggal', today).eq('status', 'hadir').eq('tipe', 'guru')
    ]);

    const totalSantri = santriRes.count || 0;
    const hadirHariIni = hadirRes.count || 0;
    const totalGuru = guruRes.count || 0;
    const hadirGuruHariIni = hadirGuruRes.count || 0;
    const tunggakan = (tunggakanRes.data || []).reduce((sum, p) => sum + (p.nominal || 0), 0);
    const totalTabungan = (tabunganRes.data || []).reduce((sum, t) => sum + (t.saldo || 0), 0);

    // Process Trend
    const trendMap = {};
    (trendDataRes.data || []).forEach(a => {
      trendMap[a.tanggal] = (trendMap[a.tanggal] || 0) + 1;
    });
    const kehadiranTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      kehadiranTrend.push(trendMap[dateStr] || 0);
    }

    // Process Distribusi
    const distribusiKelas = (kelasRes.data || []).map(k => {
      const count = (santriDistRes.data || []).filter(s => s.kelas_id === k.id).length;
      return { label: k.nama_kelas, value: count };
    });

    ok(res, { totalSantri, hadirHariIni, totalGuru, hadirGuruHariIni, tunggakan, totalTabungan, kehadiranTrend, distribusiKelas });
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/dashboard/aktivitas', async (req, res) => {
  try {
    const { data } = await supabase.from('absensi')
      .select('*, santri:santri_id(nama_lengkap, kelas:kelas_id(nama_kelas))')
      .eq('tipe', 'santri').order('waktu_scan', { ascending: false }).limit(10);
    ok(res, data || []);
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== SANTRI ====================
app.get('/api/santri', async (req, res) => {
  try {
    const { search, kelas, status } = req.query;
    let q = supabase.from('santri').select('*, kelas:kelas_id(nama_kelas, kode_kelas), wali:wali_kelas_id(nama_lengkap)');
    if (search) q = q.or(`nama_lengkap.ilike.%${search}%,nomor_induk.ilike.%${search}%`);
    if (kelas) q = q.eq('kelas_id', kelas);
    if (status && status !== 'semua') q = q.eq('status', status);
    const { data, error } = await q.order('nama_lengkap');
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/santri/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('santri')
      .select('*, kelas:kelas_id(nama_kelas), wali:wali_kelas_id(nama_lengkap)')
      .eq('id', req.params.id).single();
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/santri', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'kk', maxCount: 1 }, { name: 'akte', maxCount: 1 }]), async (req, res) => {
  try {
    const santriData = { ...req.body };
    
    // Upload files if present
    if (req.files) {
      if (req.files.foto) {
         santriData.foto_url = await uploadToGDrive(req.files.foto[0], `Foto_${santriData.nomor_induk}_${Date.now()}`);
      }
      if (req.files.kk) {
         santriData.kk_url = await uploadToGDrive(req.files.kk[0], `KK_${santriData.nomor_induk}_${Date.now()}`);
      }
      if (req.files.akte) {
         santriData.akte_url = await uploadToGDrive(req.files.akte[0], `Akte_${santriData.nomor_induk}_${Date.now()}`);
      }
    }

    // LOGIKA PASSWORD DEFAULT OTOMATIS - PALU GODAM
    const rawPwd = santriData.password;
    if (rawPwd === undefined || rawPwd === null || String(rawPwd).trim() === '' || String(rawPwd) === 'null' || String(rawPwd) === 'undefined') {
      santriData.password = 'siswa123';
    }

    const { data, error } = await supabase.from('santri').insert(santriData).select().single();
    if (error) throw error;
    
    // Create in Supabase Auth
    await supabase.auth.admin.createUser({
      email: `${data.nomor_induk.toLowerCase()}@tpq.com`,
      password: data.password || 'siswa123',
      email_confirm: true,
      user_metadata: { role: 'siswa', db_id: data.id, name: data.nama_lengkap }
    }).catch(e => console.log('Auth create err:', e.message));

    ok(res, data, 'Santri berhasil ditambahkan');
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/santri/:id', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'kk', maxCount: 1 }, { name: 'akte', maxCount: 1 }]), async (req, res) => {
  try {
    const santriData = { ...req.body };
    
    // Ambil nomor induk untuk nama file
    const { data: currentSantri } = await supabase.from('santri').select('nomor_induk').eq('id', req.params.id).single();
    const noInduk = currentSantri?.nomor_induk || 'SANTRI';

    // Upload files if present
    if (req.files) {
      if (req.files.foto) {
         santriData.foto_url = await uploadToGDrive(req.files.foto[0], `Foto_${noInduk}_${Date.now()}`);
      }
      if (req.files.kk) {
         santriData.kk_url = await uploadToGDrive(req.files.kk[0], `KK_${noInduk}_${Date.now()}`);
      }
      if (req.files.akte) {
         santriData.akte_url = await uploadToGDrive(req.files.akte[0], `Akte_${noInduk}_${Date.now()}`);
      }
    }

    const { data, error } = await supabase.from('santri').update(santriData).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data, 'Data santri berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/santri/:id', async (req, res) => {
  try {
    const { data: santri } = await supabase.from('santri').select('nomor_induk').eq('id', req.params.id).single();
    const { error } = await supabase.from('santri').delete().eq('id', req.params.id);
    if (error) throw error;
    
    // Delete from Supabase Auth
    if (santri) {
      const email = `${santri.nomor_induk.toLowerCase()}@tpq.com`;
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = (usersData?.users || []).find(u => u.email === email);
      if (authUser) await supabase.auth.admin.deleteUser(authUser.id);
    }

    ok(res, null, 'Santri berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== GURU ====================
app.get('/api/guru', async (req, res) => {
  try {
    const { search } = req.query;
    let q = supabase.from('guru').select('*');
    if (search) q = q.or(`nama_lengkap.ilike.%${search}%,nip.ilike.%${search}%`);
    const { data, error } = await q.order('nama_lengkap');
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/guru', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'kk', maxCount: 1 }, { name: 'ktp', maxCount: 1 }, { name: 'ijazah', maxCount: 1 }]), async (req, res) => {
  try {
    const guruData = { ...req.body };
    
    // Upload files if present
    if (req.files) {
      if (req.files.foto) {
         guruData.foto_url = await uploadToGDrive(req.files.foto[0], `Foto_Guru_${guruData.nip}_${Date.now()}`);
      }
      if (req.files.kk) {
         guruData.kk_url = await uploadToGDrive(req.files.kk[0], `KK_Guru_${guruData.nip}_${Date.now()}`);
      }
      if (req.files.ktp) {
         guruData.ktp_url = await uploadToGDrive(req.files.ktp[0], `KTP_Guru_${guruData.nip}_${Date.now()}`);
      }
      if (req.files.ijazah) {
         guruData.ijazah_url = await uploadToGDrive(req.files.ijazah[0], `Ijazah_Guru_${guruData.nip}_${Date.now()}`);
      }
    }

    // LOGIKA PASSWORD DEFAULT OTOMATIS - PALU GODAM
    const rawPwdGuru = guruData.password;
    if (rawPwdGuru === undefined || rawPwdGuru === null || String(rawPwdGuru).trim() === '' || String(rawPwdGuru) === 'null' || String(rawPwdGuru) === 'undefined') {
      guruData.password = 'guru123';
    }

    const { data, error } = await supabase.from('guru').insert(guruData).select().single();
    if (error) throw error;
    
    // Create in Supabase Auth
    await supabase.auth.admin.createUser({
      email: `${data.nip.toLowerCase()}@tpq.com`,
      password: data.password || 'guru123',
      email_confirm: true,
      user_metadata: { role: 'guru', db_id: data.id, name: data.nama_lengkap }
    }).catch(e => console.log('Auth create err:', e.message));

    ok(res, data, 'Guru berhasil ditambahkan');
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/guru/:id', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'kk', maxCount: 1 }, { name: 'ktp', maxCount: 1 }, { name: 'ijazah', maxCount: 1 }]), async (req, res) => {
  try {
    const guruData = { ...req.body };
    
    // Ambil NIP untuk nama file
    const { data: currentGuru } = await supabase.from('guru').select('nip').eq('id', req.params.id).single();
    const nip = currentGuru?.nip || 'GURU';

    // Upload files if present
    if (req.files) {
      if (req.files.foto) {
         guruData.foto_url = await uploadToGDrive(req.files.foto[0], `Foto_Guru_${nip}_${Date.now()}`);
      }
      if (req.files.kk) {
         guruData.kk_url = await uploadToGDrive(req.files.kk[0], `KK_Guru_${nip}_${Date.now()}`);
      }
      if (req.files.ktp) {
         guruData.ktp_url = await uploadToGDrive(req.files.ktp[0], `KTP_Guru_${nip}_${Date.now()}`);
      }
      if (req.files.ijazah) {
         guruData.ijazah_url = await uploadToGDrive(req.files.ijazah[0], `Ijazah_Guru_${nip}_${Date.now()}`);
      }
    }

    const { data, error } = await supabase.from('guru').update(guruData).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data, 'Data guru berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/guru/:id', async (req, res) => {
  try {
    const { data: guru } = await supabase.from('guru').select('nip').eq('id', req.params.id).single();
    const { error } = await supabase.from('guru').delete().eq('id', req.params.id);
    if (error) throw error;
    
    // Delete from Supabase Auth
    if (guru) {
      const email = `${guru.nip.toLowerCase()}@tpq.com`;
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = (usersData?.users || []).find(u => u.email === email);
      if (authUser) await supabase.auth.admin.deleteUser(authUser.id);
    }

    ok(res, null, 'Guru berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== KELAS ====================
app.get('/api/kelas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('kelas')
      .select('*, wali_kelas:wali_kelas_id(id, nama_lengkap)')
      .order('urutan');
    if (error) throw error;
    
    // Get santri count per kelas
    const { data: counts } = await supabase.from('santri').select('kelas_id').eq('status', 'aktif');
    const countMap = {};
    (counts || []).forEach(s => { countMap[s.kelas_id] = (countMap[s.kelas_id] || 0) + 1; });
    
    const enriched = (data || []).map(k => ({ ...k, jumlah_santri: countMap[k.id] || 0 }));
    ok(res, enriched);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/kelas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('kelas').insert(req.body).select().single();
    if (error) throw error;
    ok(res, data, 'Kelas berhasil ditambahkan');
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/kelas/:id/santri', async (req, res) => {
  try {
    const { data, error } = await supabase.from('santri')
      .select('id, nomor_induk, nama_lengkap, status')
      .eq('kelas_id', req.params.id).eq('status', 'aktif').order('nama_lengkap');
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/kelas/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('kelas').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== ABSENSI ====================
app.get('/api/absensi', async (req, res) => {
  try {
    const { tanggal, kelas, search, santri_id, role } = req.query;
    const tipe = role || 'santri'; // Default ke santri jika tidak ada role
    
    // Gunakan left join (tanpa !inner) agar data absensi tetap muncul meskipun relasinya null
    // Tapi karena kita filter per tab, kita bisa tentukan mana yang di-load
    let selectStr = '*, santri(nama_lengkap, nomor_induk, kelas_id, kelas:kelas_id(nama_kelas)), guru(nama_lengkap, nip)';
    
    let q = supabase.from('absensi').select(selectStr).eq('tipe', tipe);
    
    if (tanggal) q = q.eq('tanggal', tanggal);
    
    if (tipe === 'santri') {
      if (kelas) q = q.eq('santri.kelas_id', kelas);
      if (santri_id) q = q.eq('santri_id', santri_id);
      if (search) q = q.ilike('santri.nama_lengkap', `%${search}%`);
    } else {
      if (search) q = q.ilike('guru.nama_lengkap', `%${search}%`);
    }
    
    const { data, error } = await q.order('tanggal', { ascending: false }).order('waktu_scan', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/absensi', async (req, res) => {
  try {
    const { santri_id, guru_id, tanggal, tipe } = req.body;
    
    // 1. Cek duplikasi untuk Santri ATAU Guru (1x sehari)
    const idToCheck = tipe === 'santri' ? santri_id : guru_id;
    const fieldToCheck = tipe === 'santri' ? 'santri_id' : 'guru_id';

    if (idToCheck && tanggal) {
      const { data: existing } = await supabase
        .from('absensi')
        .select('id')
        .eq(fieldToCheck, idToCheck)
        .eq('tanggal', tanggal)
        .maybeSingle();
      
      if (existing) {
        return ok(res, existing, `${tipe === 'santri' ? 'Santri' : 'Guru'} sudah diabsenkan hari ini`);
      }
    }

    // 2. Bersihkan body dari id & waktu_scan jika ada (biar DB yang generate otomatis)
    const insertData = { ...req.body };
    delete insertData.id;
    if (!insertData.waktu_scan) delete insertData.waktu_scan;

    const { data, error } = await supabase.from('absensi').insert(insertData).select().single();
    if (error) throw error;
    
    ok(res, data, 'Absensi berhasil dicatat');
  } catch (e) { 
    console.error('Absensi Error:', e.message);
    fail(res, e.message, 500); 
  }
});

app.put('/api/absensi/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('absensi').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data, 'Absensi berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/absensi/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('absensi').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Absensi berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});


// ==================== PEMBAYARAN ====================
app.get('/api/pembayaran', async (req, res) => {
  try {
    const { bulan, tahun, status, santri_id, jenis_pembayaran_id } = req.query;
    let q = supabase.from('pembayaran')
      .select('*, santri:santri_id(nama_lengkap, nomor_induk, no_hp_wali, no_hp_ayah, no_hp_ibu, kelas:kelas_id(nama_kelas)), jenis:jenis_pembayaran_id(nama)');
    if (bulan) q = q.eq('bulan', bulan);
    if (tahun) q = q.eq('tahun', tahun);
    if (status) q = q.eq('status', status);
    if (santri_id) q = q.eq('santri_id', santri_id);
    if (jenis_pembayaran_id) q = q.eq('jenis_pembayaran_id', jenis_pembayaran_id);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/pembayaran/:id', async (req, res) => {
  try {
    const { status, tanggal_bayar, metode_bayar, catatan } = req.body;
    
    // 1. Jika metode bayar adalah tabungan, proses pemotongan saldo
    if (metode_bayar === 'tabungan' && status === 'lunas') {
      // Ambil data tagihan untuk tahu santri_id dan nominal
      const { data: bill } = await supabase.from('pembayaran')
        .select('santri_id, nominal, jenis:jenis_pembayaran_id(nama)')
        .eq('id', req.params.id)
        .single();
      
      if (!bill) return fail(res, 'Tagihan tidak ditemukan');

      // Ambil saldo saat ini
      const { data: history } = await supabase.from('tabungan_santri')
        .select('jenis, nominal')
        .eq('santri_id', bill.santri_id);
      
      const saldo = (history || []).reduce((s, t) => s + (t.jenis === 'setor' ? t.nominal : -t.nominal), 0);

      if (bill.nominal > saldo) {
        return fail(res, `Saldo tabungan tidak mencukupi. Saldo saat ini: Rp ${saldo.toLocaleString('id-ID')}`);
      }

      // Potong saldo (Insert ke tabungan_santri)
      const newSaldo = saldo - bill.nominal;
      const { error: errTabungan } = await supabase.from('tabungan_santri').insert({
        santri_id: bill.santri_id,
        jenis: 'tarik',
        nominal: bill.nominal,
        saldo_setelah: newSaldo,
        keterangan: `Bayar ${bill.jenis?.nama || 'Tagihan'} via Tabungan`,
        tanggal: tanggal_bayar || new Date().toISOString().split('T')[0]
      });

      if (errTabungan) throw errTabungan;
    }

    // 2. Update status pembayaran
    const { data, error } = await supabase.from('pembayaran')
      .update({ status, tanggal_bayar, metode_bayar, catatan })
      .eq('id', req.params.id)
      .select('*, jenis:jenis_pembayaran_id(nama)').single();
    
    if (error) throw error;

    // 3. Jika ini adalah pembayaran Tabungan Wajib, masukkan sebagai setoran di tabungan santri
    if (data && data.status === 'lunas' && data.jenis?.nama?.toLowerCase().includes('tabungan wajib')) {
      const { data: existingTabungan } = await supabase.from('tabungan_santri')
        .select('id')
        .eq('santri_id', data.santri_id)
        .eq('keterangan', `Setoran Tabungan Wajib (Ref: ${data.id})`)
        .maybeSingle();

      if (!existingTabungan) {
        // Ambil saldo saat ini
        const { data: history } = await supabase.from('tabungan_santri')
          .select('jenis, nominal')
          .eq('santri_id', data.santri_id);
        
        let saldo = (history || []).reduce((s, t) => s + (t.jenis === 'setor' ? t.nominal : -t.nominal), 0);
        const newSaldo = saldo + data.nominal;

        await supabase.from('tabungan_santri').insert({
          santri_id: data.santri_id,
          jenis: 'setor',
          nominal: data.nominal,
          saldo_setelah: newSaldo,
          keterangan: `Setoran Tabungan Wajib (Ref: ${data.id})`,
          tanggal: data.tanggal_bayar || new Date().toISOString().split('T')[0]
        });
      }
    }

    ok(res, data, 'Pembayaran berhasil dikonfirmasi');
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/pembayaran/stats', async (req, res) => {
  try {
    const { bulan, tahun, jenis_pembayaran_id } = req.query;
    const now = new Date();
    const b = bulan || now.getMonth() + 1;
    const t = tahun || now.getFullYear();
    
    let qLunas = supabase.from('pembayaran').select('nominal').eq('bulan', b).eq('tahun', t).eq('status', 'lunas');
    let qBelum = supabase.from('pembayaran').select('nominal').eq('bulan', b).eq('tahun', t).eq('status', 'belum');
    
    if (jenis_pembayaran_id) {
      qLunas = qLunas.eq('jenis_pembayaran_id', jenis_pembayaran_id);
      qBelum = qBelum.eq('jenis_pembayaran_id', jenis_pembayaran_id);
    }
    
    const { data: lunas } = await qLunas;
    const { data: belum } = await qBelum;
    const totalLunas = (lunas || []).reduce((s, p) => s + (p.nominal || 0), 0);
    const totalBelum = (belum || []).reduce((s, p) => s + (p.nominal || 0), 0);
    ok(res, { totalLunas, totalBelum, jumlahLunas: (lunas || []).length, jumlahBelum: (belum || []).length });
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/pembayaran', async (req, res) => {
  try {
    const insertData = { ...req.body };
    if (!insertData.id) delete insertData.id;
    const { data, error } = await supabase.from('pembayaran').insert(insertData).select('*, jenis:jenis_pembayaran_id(nama)').single();
    if (error) throw error;

    // Jika ini adalah pembayaran Tabungan Wajib yang langsung lunas, masukkan sebagai setoran di tabungan santri
    if (data && data.status === 'lunas' && data.jenis?.nama?.toLowerCase().includes('tabungan wajib')) {
      // Ambil saldo saat ini
      const { data: history } = await supabase.from('tabungan_santri')
        .select('jenis, nominal')
        .eq('santri_id', data.santri_id);
      
      let saldo = (history || []).reduce((s, t) => s + (t.jenis === 'setor' ? t.nominal : -t.nominal), 0);
      const newSaldo = saldo + data.nominal;

      await supabase.from('tabungan_santri').insert({
        santri_id: data.santri_id,
        jenis: 'setor',
        nominal: data.nominal,
        saldo_setelah: newSaldo,
        keterangan: `Setoran Tabungan Wajib (Ref: ${data.id})`,
        tanggal: data.tanggal_bayar || new Date().toISOString().split('T')[0]
      });
    }

    ok(res, data, 'Pembayaran berhasil dicatat');
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/pembayaran/generate', async (req, res) => {
  try {
    const { bulan, tahun, nominal, jenis_pembayaran_id, kelas_id } = req.body;
    
    // 1. Ambil list santri target
    let q = supabase.from('santri').select('id').eq('status', 'aktif');
    if (kelas_id) q = q.eq('kelas_id', kelas_id);
    const { data: santriList } = await q;
    if (!santriList || santriList.length === 0) return fail(res, 'Tidak ada santri aktif');

    // 2. Cek tagihan yang SUDAH ADA untuk periode & jenis ini
    const { data: existing } = await supabase.from('pembayaran')
      .select('santri_id')
      .eq('jenis_pembayaran_id', jenis_pembayaran_id)
      .eq('bulan', parseInt(bulan))
      .eq('tahun', parseInt(tahun));
    
    const existingIds = new Set((existing || []).map(e => e.santri_id));

    // 3. Filter santri yang belum punya tagihan ini
    const toGenerate = santriList.filter(s => !existingIds.has(s.id));
    
    if (toGenerate.length === 0) return ok(res, { generated: 0 }, 'Semua santri sudah memiliki tagihan untuk periode ini');

    const records = toGenerate.map(s => ({
      santri_id: s.id, 
      jenis_pembayaran_id, 
      bulan: parseInt(bulan), 
      tahun: parseInt(tahun),
      nominal: parseInt(nominal), 
      status: 'belum', 
      tahun_ajaran: `${tahun}/${parseInt(tahun)+1}`
    }));

    const { error } = await supabase.from('pembayaran').insert(records);
    if (error) throw error;
    ok(res, { generated: records.length }, `${records.length} tagihan baru berhasil dibuat (${existingIds.size} sudah ada sebelumnya)`);
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/pembayaran/:id', async (req, res) => {
  try {
    // Delete any associated tabungan record first
    await supabase.from('tabungan_santri').delete().eq('keterangan', `Setoran Tabungan Wajib (Ref: ${req.params.id})`);

    const { error } = await supabase.from('pembayaran').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Data pembayaran berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== TABUNGAN ====================
app.get('/api/tabungan', async (req, res) => {
  try {
    const { guru_id } = req.query;
    
    // 1. Ambil data santri dasar dulu
    let q = supabase.from('santri')
      .select('id, nomor_induk, nama_lengkap, status, kelas_id, kelas:kelas_id(id, nama_kelas, wali_kelas_id)')
      .eq('status', 'aktif');
    
    if (guru_id) {
      // Jika guru_id ada, filter santri yang kelasnya diampuni oleh guru tersebut
      // Cari kelas yang wali_kelas_id = guru_id
      const { data: classes } = await supabase.from('kelas').select('id').eq('wali_kelas_id', guru_id);
      const classIds = (classes || []).map(c => c.id);
      q = q.in('kelas_id', classIds);
    }

    const { data: santriList, error: errSantri } = await q.order('nama_lengkap');
    
    if (errSantri) {
      console.error('Error Santri:', errSantri);
      throw errSantri;
    }

    // 2. Ambil data saldo
    const { data: saldoData } = await supabase.from('v_saldo_tabungan').select('santri_id, saldo');
    
    const saldoMap = {};
    (saldoData || []).forEach(s => { saldoMap[s.santri_id] = s.saldo; });

    // 3. Gabungkan manual
    const result = (santriList || []).map(s => ({
      id: s.id,
      nomor_induk: s.nomor_induk,
      nama_lengkap: s.nama_lengkap,
      kelas: s.kelas,
      saldo: saldoMap[s.id] || 0
    }));

    console.log('Tabungan Data Count:', result.length);
    ok(res, result);
  } catch (e) { 
    console.error('Catch Error Tabungan:', e.message);
    fail(res, e.message, 500); 
  }
});

app.get('/api/tabungan/summary-guru', async (req, res) => {
  try {
    const { data: kelasList } = await supabase.from('kelas').select('id, nama_kelas, wali:wali_kelas_id(id, nama_lengkap)');
    const { data: saldoData } = await supabase.from('v_saldo_tabungan').select('santri_id, saldo');
    const { data: santriList } = await supabase.from('santri').select('id, kelas_id').eq('status', 'aktif');

    const saldoMap = {};
    (saldoData || []).forEach(s => { saldoMap[s.santri_id] = s.saldo; });

    const teacherMap = {};
    (kelasList || []).forEach(k => {
      const waliId = k.wali?.id || 'tanpa_wali';
      const waliNama = k.wali?.nama_lengkap || 'Tanpa Wali';
      
      if (!teacherMap[waliId]) {
        teacherMap[waliId] = {
          id: waliId,
          nama_guru: waliNama,
          kelas_names: [],
          total_saldo: 0,
          jumlah_santri: 0
        };
      }
      
      const santriInKelas = (santriList || []).filter(s => s.kelas_id === k.id);
      const saldoKelas = santriInKelas.reduce((sum, s) => sum + (saldoMap[s.id] || 0), 0);
      
      teacherMap[waliId].kelas_names.push(k.nama_kelas);
      teacherMap[waliId].total_saldo += saldoKelas;
      teacherMap[waliId].jumlah_santri += santriInKelas.length;
    });

    ok(res, Object.values(teacherMap));
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/tabungan/:santriId/riwayat', async (req, res) => {
  try {
    const { month, year } = req.query;
    let q = supabase.from('tabungan_santri')
      .select('*').eq('santri_id', req.params.santriId);
    
    if (month && year) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      q = q.gte('tanggal', startDate).lte('tanggal', endDate);
    }

    const { data, error } = await q.order('tanggal', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/tabungan', async (req, res) => {
  try {
    const { santri_id, jenis, nominal, keterangan, tanggal, recorded_by } = req.body;
    // Get current saldo
    const { data: history } = await supabase.from('tabungan_santri').select('jenis, nominal').eq('santri_id', santri_id);
    let saldo = (history || []).reduce((s, t) => s + (t.jenis === 'setor' ? t.nominal : -t.nominal), 0);
    if (jenis === 'tarik' && nominal > saldo) return fail(res, 'Saldo tidak mencukupi');
    saldo = jenis === 'setor' ? saldo + parseInt(nominal) : saldo - parseInt(nominal);
    const { data, error } = await supabase.from('tabungan_santri').insert({
      santri_id, jenis, nominal: parseInt(nominal), saldo_setelah: saldo,
      keterangan, tanggal: tanggal || new Date().toISOString().split('T')[0],
      recorded_by
    }).select().single();
    if (error) throw error;
    ok(res, data, `${jenis === 'setor' ? 'Setoran' : 'Penarikan'} berhasil`);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/tabungan/setor-admin', async (req, res) => {
  try {
    const { guru_id, nominal, keterangan } = req.body;
    const { data, error } = await supabase.from('setoran_guru').insert({
      guru_id, nominal, keterangan, status: 'diterima' // Otomatis diterima untuk saat ini sesuai request
    }).select().single();
    if (error) throw error;
    ok(res, data, 'Setoran ke admin berhasil dicatat');
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/tabungan/rekap-admin', async (req, res) => {
  try {
    const { data, error } = await supabase.from('setoran_guru')
      .select('*, guru:guru_id(nama_lengkap)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/tabungan/rekap-guru', async (req, res) => {
  try {
    const { data, error } = await supabase.from('v_rekap_guru_tabungan').select('*');
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/tabungan/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('tabungan_santri').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Transaksi tabungan berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== LAPORAN ====================
app.get('/api/laporan/keuangan', async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    let q = supabase.from('pembayaran')
      .select('*, santri:santri_id(nama_lengkap, nomor_induk), jenis:jenis_pembayaran_id(nama)');
    
    if (bulan) q = q.eq('bulan', bulan);
    if (tahun) q = q.eq('tahun', tahun);

    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;

    const totalMasuk = (data || []).filter(p => p.status === 'lunas').reduce((s, p) => s + p.nominal, 0);
    const totalTunggakan = (data || []).filter(p => p.status === 'belum').reduce((s, p) => s + p.nominal, 0);
    
    // Rekap per kategori
    const perKategori = {};
    (data || []).forEach(p => {
      const catName = p.jenis?.nama || 'Lainnya';
      if (!perKategori[catName]) perKategori[catName] = { masuk: 0, tunggakan: 0 };
      if (p.status === 'lunas') perKategori[catName].masuk += p.nominal;
      else perKategori[catName].tunggakan += p.nominal;
    });
    
    ok(res, { totalMasuk, totalTunggakan, perKategori, totalTransaksi: (data || []).length, data });
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/laporan/absensi', async (req, res) => {
  try {
    const { dari, sampai, kelas_id } = req.query;
    let q = supabase.from('absensi')
      .select('*, santri:santri_id(nama_lengkap, nomor_induk, kelas:kelas_id(nama_kelas))')
      .eq('tipe', 'santri');
    
    if (dari) q = q.gte('tanggal', dari);
    if (sampai) q = q.lte('tanggal', sampai);
    
    const { data, error } = await q.order('tanggal', { ascending: false });
    if (error) throw error;

    const hadir = (data || []).filter(a => a.status === 'hadir').length;
    const sakit = (data || []).filter(a => a.status === 'sakit').length;
    const izin = (data || []).filter(a => a.status === 'izin').length;
    const alfa = (data || []).filter(a => a.status === 'alfa').length;

    ok(res, { hadir, sakit, izin, alfa, total: (data || []).length, data });
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/laporan/tabungan', async (req, res) => {
  try {
    const { dari, sampai } = req.query;
    let q = supabase.from('tabungan_santri')
      .select('*, santri:santri_id(nama_lengkap, nomor_induk, kelas:kelas_id(nama_kelas))');
    
    if (dari) q = q.gte('tanggal', dari);
    if (sampai) q = q.lte('tanggal', sampai);

    const { data, error } = await q.order('tanggal', { ascending: false });
    if (error) throw error;

    const totalSetor = (data || []).filter(t => t.jenis === 'setor').reduce((s, t) => s + t.nominal, 0);
    const totalTarik = (data || []).filter(t => t.jenis === 'tarik').reduce((s, t) => s + t.nominal, 0);

    ok(res, { totalSetor, totalTarik, data });
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/laporan/akademik', async (req, res) => {
  try {
    const { data: history, error } = await supabase.from('riwayat_kelas')
      .select('*, santri:santri_id(nama_lengkap, nomor_induk), kelas_dari:kelas_dari_id(nama_kelas), kelas_ke:kelas_ke_id(nama_kelas)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Fetch all active target_pencapaian to filter out not-yet-promoted students
    const { data: targets, error: errorTarget } = await supabase.from('target_pencapaian').select('santri_id, kelas_id');
    if (errorTarget) throw errorTarget;

    const activeTargets = new Set((targets || []).map(t => `${t.santri_id}:${t.kelas_id}`));

    const filteredData = (history || []).filter(h => {
      const isNotPromotedYet = h.kelas_ke_id === h.kelas_dari_id && activeTargets.has(`${h.santri_id}:${h.kelas_dari_id}`);
      return !isNotPromotedYet;
    });

    ok(res, { data: filteredData });
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== PENGATURAN ====================
app.get('/api/pengaturan', async (req, res) => {
  try {
    const { data, error } = await supabase.from('pengaturan').select('*');
    if (error) throw error;
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    ok(res, settings);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/pengaturan', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('pengaturan').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    ok(res, null, 'Pengaturan berhasil disimpan');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== UJIAN & KENAIKAN ====================
app.get('/api/ujian', async (req, res) => {
  try {
    const { kelas } = req.query;
    let query = supabase.from('target_pencapaian')
      .select('*, santri:santri_id(id, nama_lengkap, nomor_induk, kelas:kelas_id(id, nama_kelas, urutan, wali:wali_kelas_id(nama_lengkap))), kelas:kelas_id(nama_kelas)');
    
    if (kelas) query = query.eq('kelas_id', kelas);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;

    // Fetch latest riwayat for each santri to check lulus status
    const result = await Promise.all((data || []).map(async item => {
      const { data: latest } = await supabase.from('riwayat_kelas')
        .select('status_tes')
        .eq('santri_id', item.santri_id)
        .eq('kelas_dari_id', item.kelas_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...item,
        santri: {
          ...item.santri,
          latest_riwayat: latest || null
        }
      };
    }));

    ok(res, result);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/ujian/register', async (req, res) => {
  try {
    const { santri_ids, nomor_tes, tanggal_mulai, tanggal_selesai, masa_tempuh } = req.body;
    if (!santri_ids || !Array.isArray(santri_ids)) return fail(res, 'Santri tidak valid');

    const results = [];
    const target = parseInt(masa_tempuh) || 60;

    for (const sid of santri_ids) {
      // Ambil data santri untuk tahu kelasnya sekarang
      const { data: santri, error: sError } = await supabase.from('santri').select('kelas_id').eq('id', sid).single();
      if (sError || !santri) continue;

      // Cek apakah sudah ada di target_pencapaian
      const { data: existing } = await supabase.from('target_pencapaian')
        .select('id').eq('santri_id', sid).eq('kelas_id', santri.kelas_id).is('tanggal_selesai', null).maybeSingle();

      const payload = {
        nomor_tes: nomor_tes || null,
        tanggal_mulai: tanggal_mulai || null,
        tanggal_selesai: tanggal_selesai || null,
        target_hari: target,
        aktual_hari: target // Langsung set siap ujian
      };

      if (existing) {
        const { data, error } = await supabase.from('target_pencapaian').update(payload).eq('id', existing.id).select().single();
        if (error) throw error;
        results.push(data);
      } else {
        const { data, error } = await supabase.from('target_pencapaian').insert({
          santri_id: sid,
          kelas_id: santri.kelas_id,
          ...payload
        }).select().single();
        if (error) throw error;
        results.push(data);
      }
    }
    ok(res, results, `${results.length} santri berhasil didaftarkan ujian`);
  } catch (e) { 
    console.error('Ujian Register Error:', e.message);
    fail(res, e.message, 500); 
  }
});

app.delete('/api/ujian/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('target_pencapaian').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Data ujian berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/ujian/nilai', async (req, res) => {
  try {
    const { santri_id, kelas_dari_id, nilai_tes, status_tes, catatan, tanggal_tes, tanggal_naik, tanggal_mulai, tanggal_selesai } = req.body;
    
    let masa_tempuh = null;
    if (tanggal_mulai && tanggal_selesai) {
      const d1 = new Date(tanggal_mulai);
      const d2 = new Date(tanggal_selesai);
      // Hitung selisih hari (inklusif hari awal dan akhir)
      masa_tempuh = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    }

    const payload = {
      santri_id, 
      kelas_dari_id,
      kelas_ke_id: kelas_dari_id,
      nilai_tes,
      status_tes,
      catatan: catatan || null,
      tanggal_naik: tanggal_naik || tanggal_tes || new Date().toISOString().split('T')[0],
      tanggal_mulai: tanggal_mulai || null,
      tanggal_selesai: tanggal_selesai || null,
      masa_tempuh
    };

    const { data, error } = await supabase.from('riwayat_kelas').insert(payload).select().single();

    if (error) throw error;
    ok(res, data, 'Nilai ujian berhasil disimpan');
  } catch (e) { fail(res, e.message, 500); }
});

app.get('/api/ujian/history/:santriId', async (req, res) => {
  try {
    const { data: history, error: errorHistory } = await supabase.from('riwayat_kelas')
      .select('*, kelas_dari:kelas_dari_id(nama_kelas), kelas_ke:kelas_ke_id(nama_kelas)')
      .eq('santri_id', req.params.santriId)
      .order('created_at', { ascending: false });
    if (errorHistory) throw errorHistory;

    // Fetch active target_pencapaian to check which classes the student is still actively in
    const { data: targets, error: errorTarget } = await supabase.from('target_pencapaian')
      .select('kelas_id')
      .eq('santri_id', req.params.santriId);
    if (errorTarget) throw errorTarget;

    const activeClassIds = (targets || []).map(t => t.kelas_id);

    // If kelas_ke_id === kelas_dari_id and the student is still active in target_pencapaian for that class,
    // it means they just scored but haven't been promoted ("nanti saja").
    const filteredHistory = (history || []).filter(h => {
      const isNotPromotedYet = h.kelas_ke_id === h.kelas_dari_id && activeClassIds.includes(h.kelas_dari_id);
      return !isNotPromotedYet;
    });

    ok(res, filteredHistory);
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/ujian/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('riwayat_kelas').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    ok(res, data, 'Riwayat pendidikan berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/ujian/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('riwayat_kelas').delete().eq('id', id);
    if (error) throw error;
    ok(res, null, 'Riwayat pendidikan berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/ujian/naik-kelas', async (req, res) => {
  try {
    const { santri_id, kelas_dari_id, kelas_ke_id, tanggal_naik } = req.body;

    // 1. Update kelas santri di tabel santri
    const { error: errSantri } = await supabase.from('santri').update({ kelas_id: kelas_ke_id }).eq('id', santri_id);
    if (errSantri) throw errSantri;

    // 2. Update riwayat_kelas terbaru untuk santri ini
    const { data: latestRiwayat } = await supabase.from('riwayat_kelas')
      .select('id')
      .eq('santri_id', santri_id)
      .eq('kelas_dari_id', kelas_dari_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRiwayat) {
      const updateData = { kelas_ke_id: kelas_ke_id || kelas_dari_id };
      if (tanggal_naik) {
        updateData.tanggal_naik = tanggal_naik;
      } else {
        // Fallback hanya jika tidak ada data tanggal_naik sebelumnya di record tersebut
        // Kita cek dulu apakah sudah ada tanggal_naik di latestRiwayat
        const { data: current } = await supabase.from('riwayat_kelas').select('tanggal_naik').eq('id', latestRiwayat.id).single();
        if (!current?.tanggal_naik) {
          updateData.tanggal_naik = new Date().toISOString().split('T')[0];
        }
      }

      await supabase.from('riwayat_kelas').update(updateData).eq('id', latestRiwayat.id);
    }

    // 3. Tandai target_pencapaian lama sebagai selesai
    await supabase.from('target_pencapaian').delete().eq('santri_id', santri_id).eq('kelas_id', kelas_dari_id);

    // 4. Buat target_pencapaian baru untuk jilid berikutnya
    if (kelas_ke_id) {
      await supabase.from('target_pencapaian').insert({
        santri_id,
        kelas_id: kelas_ke_id,
        target_hari: 60,
        aktual_hari: 0
      });
    }

    ok(res, null, 'Santri berhasil naik kelas');
  } catch (e) { fail(res, e.message, 500); }
});

// ==================== JENIS PEMBAYARAN ====================
app.get('/api/jenis-pembayaran', async (req, res) => {
  try {
    const { data, error } = await supabase.from('jenis_pembayaran').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/jenis-pembayaran', async (req, res) => {
  try {
    const { data, error } = await supabase.from('jenis_pembayaran').insert(req.body).select().single();
    if (error) throw error;
    ok(res, data, 'Jenis pembayaran berhasil ditambahkan');
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/jenis-pembayaran/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('jenis_pembayaran').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data, 'Jenis pembayaran berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/jenis-pembayaran/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('jenis_pembayaran').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Jenis pembayaran berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});


// ==================== USER MANAGEMENT ====================
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    ok(res, data);
  } catch (e) { fail(res, e.message, 500); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').insert(req.body).select().single();
    if (error) throw error;
    ok(res, data, 'Akun berhasil ditambahkan');
  } catch (e) { fail(res, e.message, 500); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    ok(res, data, 'Akun berhasil diperbarui');
  } catch (e) { fail(res, e.message, 500); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    ok(res, null, 'Akun berhasil dihapus');
  } catch (e) { fail(res, e.message, 500); }
});

export default app;
