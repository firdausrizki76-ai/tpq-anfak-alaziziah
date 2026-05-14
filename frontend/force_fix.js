
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseDefaults() {
  console.log('Fixing database defaults via direct SQL (if possible)...');
  
  // Since we can't run raw SQL directly via the client easily without an RPC,
  // we will try to use the REST API to check if we can run something.
  // Actually, we'll just use the update logic to fix everything one last time.
  
  const { data: santri, error: e1 } = await supabase.from('santri').update({ password: 'siswa123' }).or('password.is.null,password.eq.""').select('id');
  const { data: guru, error: e2 } = await supabase.from('guru').update({ password: 'guru123' }).or('password.is.null,password.eq.""').select('id');
  
  if (e1) console.error('Santri fix error:', e1);
  else console.log(`Fixed ${santri.length} santri.`);
  
  if (e2) console.error('Guru fix error:', e2);
  else console.log(`Fixed ${guru.length} guru.`);
}

fixDatabaseDefaults();
