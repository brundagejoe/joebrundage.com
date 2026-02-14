const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your environment before using Supabase auth.`
    )
  }

  return value
}

export function getSupabaseConfig() {
  const publishableKey = supabasePublishableKey || supabaseAnonKey

  return {
    url: assertEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    publishableKey: assertEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      publishableKey
    ),
  }
}
