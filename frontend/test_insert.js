
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert with empty password...');
  const { data, error } = await supabase.from('santri').insert({
    nomor_induk: 'TEST_' + Date.now(),
    nama_lengkap: 'Test Student ' + Date.now(),
    status: 'aktif'
  }).select().single();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Inserted student password:', data.password);
  }
  
  // Clean up
  if (data) {
    await supabase.from('santri').delete().eq('id', data.id);
  }
}

testInsert();
