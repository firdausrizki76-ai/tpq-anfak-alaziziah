import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncUsers() {
  console.log('🔄 Memulai sinkronisasi data ke Supabase Authentication...');

  // 1. Buat akun Admin
  const { error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@tpq.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Administrator Utama' }
  });
  if (adminErr) console.log('⚠️ Admin:', adminErr.message);
  else console.log('✅ Admin berhasil ditambahkan (admin@tpq.com)');

  // 2. Sinkronisasi Guru
  const { data: gurus } = await supabase.from('guru').select('*');
  if (gurus) {
    for (const g of gurus) {
      const email = `${g.nip.toLowerCase()}@tpq.com`;
      const { error } = await supabase.auth.admin.createUser({
        email: email,
        password: g.password || 'guru123',
        email_confirm: true,
        user_metadata: { role: 'guru', db_id: g.id, name: g.nama_lengkap }
      });
      if (error) console.log(`⚠️ Guru ${g.nip}:`, error.message);
      else console.log(`✅ Guru ${g.nama_lengkap} ditambahkan (${email})`);
    }
  }

  // 3. Sinkronisasi Santri
  const { data: santris } = await supabase.from('santri').select('*');
  if (santris) {
    for (const s of santris) {
      const email = `${s.nomor_induk.toLowerCase()}@tpq.com`;
      const { error } = await supabase.auth.admin.createUser({
        email: email,
        password: s.password || 'siswa123',
        email_confirm: true,
        user_metadata: { role: 'siswa', db_id: s.id, name: s.nama_lengkap }
      });
      if (error) console.log(`⚠️ Santri ${s.nomor_induk}:`, error.message);
      else console.log(`✅ Santri ${s.nama_lengkap} ditambahkan (${email})`);
    }
  }

  console.log('\n🎉 Selesai! Silakan cek menu Authentication -> Users di dashboard Supabase Anda.');
}

syncUsers();
