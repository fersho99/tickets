import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Typed helper — once DB is connected, replace mock-data with:
// const supabase = createClient()
// const { data: tickets } = await supabase.from("tickets").select("*")
