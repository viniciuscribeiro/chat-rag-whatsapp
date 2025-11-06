import { createClient } from '@supabase/supabase-js'

// O Vite injeta as variáveis do .env aqui
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL ou Anon Key não encontradas. Verifique seu arquivo .env");
}

// Usando as chaves que você forneceu:
// URL: "https://deltnfayogngszcmgxff.supabase.co"
// ANON_KEY: "eyJhbGciOi...widk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)