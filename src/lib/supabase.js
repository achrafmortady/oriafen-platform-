import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'your-supabase-project-url' &&
  supabaseKey !== 'your-supabase-anon-key' &&
  supabaseUrl.startsWith('https://')
)

// Only create the client when credentials are actually present.
// Calling createClient(undefined, undefined) throws and breaks the app.
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null
