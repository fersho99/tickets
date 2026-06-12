import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente Supabase para Server Components y Route Handlers.
// Lee y escribe cookies del request — mantiene la sesión del usuario en el servidor.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components de solo lectura las cookies no se pueden escribir.
            // El middleware se encarga de actualizar las cookies en esos casos.
          }
        },
      },
    }
  )
}
