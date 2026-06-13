import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"

const createUserSchema = z.object({
  nombre: z.string().min(2).max(100),
  email:  z.string().email(),
  rol:    z.enum(["lider_ti", "admin", "developer", "staff"]),
})

const ROLE_LIMITS: Record<string, number> = { admin: 2, lider_ti: 2 }

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getCallerProfile(): Promise<{ rol: string; empresa_id: string | null } | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("rol, empresa_id")
    .eq("id", user.id)
    .single()
  return data ?? null
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local" },
      { status: 500 }
    )
  }

  const callerProfile = await getCallerProfile()
  if (!callerProfile || !["lider_ti", "admin"].includes(callerProfile.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const { nombre, email, rol } = parsed.data
  const { empresa_id } = callerProfile

  const supabase = getAdminClient()

  // Verificar límite de roles por empresa
  if (empresa_id && ROLE_LIMITS[rol]) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", empresa_id)
      .eq("rol", rol)

    if ((count ?? 0) >= ROLE_LIMITS[rol]) {
      const label = rol === "admin" ? "administradores" : "líderes de TI"
      return NextResponse.json(
        { error: `Límite alcanzado: máximo ${ROLE_LIMITS[rol]} ${label} por empresa` },
        { status: 400 }
      )
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (profileCheckError) {
    console.error("[/api/users] profiles check error:", profileCheckError)
  }

  let userId: string

  if (existingProfile) {
    userId = existingProfile.id
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ rol, nombre, activo: true, empresa_id })
      .eq("id", userId)
    if (updateErr) console.error("[/api/users] profile update error:", updateErr)
  } else {
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nombre, rol },
    })

    if (createError) {
      console.error("[/api/users] createUser error:", createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    userId = data.user.id

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, rol, nombre, activo: true, empresa_id }, { onConflict: "id" })
    if (upsertErr) console.error("[/api/users] profile upsert error:", upsertErr)
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/auth/confirm` },
  })

  if (linkError) {
    console.error("[/api/users] generateLink error:", linkError)
    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    userId,
    activationLink: linkData?.properties?.action_link ?? null,
  })
}

export async function DELETE(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }, { status: 500 })
  }

  const callerProfile = await getCallerProfile()
  if (!callerProfile || !["lider_ti", "admin"].includes(callerProfile.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
