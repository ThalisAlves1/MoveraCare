import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env do backend.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
