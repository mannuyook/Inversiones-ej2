import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Creamos un cliente seguro o con validación para que no rompa el build si faltan en algún microsegundo
export const supabase = createClient(supabaseUrl, supabasePublishableKey)