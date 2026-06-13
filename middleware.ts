import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { EXCLUSIVE, ROLE_HOME } from "@/lib/routes"
import type { UserRole } from "@/lib/types"

const PROTECTED_PATHS = [
  "/dashboard",
  "/tickets",
  "/proyectos",
  "/asignar-tareas",
  "/mi-tablero",
  "/mis-solicitudes",
  "/nuevo-ticket",
  "/reportes-ia",
  "/configuracion",
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Bloquear rutas protegidas sin sesión activa
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Verificar rol para rutas exclusivas — query solo cuando aplica
  if (user && EXCLUSIVE[pathname]) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single()

    if (profile && !EXCLUSIVE[pathname].includes(profile.rol as UserRole)) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_HOME[profile.rol as UserRole] ?? "/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
