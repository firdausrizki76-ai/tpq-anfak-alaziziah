
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswords() {
  const { data, error } = await supabase
    .from('santri')
    .update({ password: 'siswa123' })
    .or('password.is.null,password.eq.""')
    .select();

  if (error) {
    console.error('Error updating students:', error);
  } else {
    console.log(`Successfully updated ${data.length} students.`);
  }
}

updatePasswords();
