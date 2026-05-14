
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_triggers'); // Custom RPC?
  if (error) {
    console.log('RPC get_triggers failed, trying raw query...');
    // We can't do raw query easily.
  } else {
    console.log('Triggers:', data);
  }
}

checkTriggers();
