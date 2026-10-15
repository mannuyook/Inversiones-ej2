import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

// Creamos el cliente de forma segura para evitar bloqueos en el build
export const supabase = createClient(supabaseUrl, supabaseKey, {
auth: {
    persistSession: false,
    autoRefreshToken: false,
},
});