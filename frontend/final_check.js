
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  const { data: all } = await supabase.from('santri').select('id, nama_lengkap, password');
  const missing = all.filter(s => !s.password || s.password.trim() === '');
  
  console.log('Total students in DB:', all.length);
  console.log('Students with missing password:', missing.length);
  
  if (missing.length > 0) {
    console.log('Missing names:', missing.map(m => m.nama_lengkap).join(', '));
    const ids = missing.map(m => m.id);
    const { error } = await supabase.from('santri').update({ password: 'siswa123' }).in('id', ids);
    if (error) console.error('Error updating:', error);
    else console.log('Successfully updated missing passwords.');
  }
}

checkAndFix();
