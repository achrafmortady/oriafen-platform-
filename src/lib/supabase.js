// This isolated checkout deliberately cannot initialize any Supabase client.
// No environment variable, including an inherited production key, can enable it.
export const isConfigured = false
export const supabase = null
