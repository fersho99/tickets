import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const registerSchema = z.object({
  empresa:  z.string().min(2).max(255),
  nombre:   z.string().min(2).max(100),
  rol:      z.enum(["admin", "lider_ti"]),
  email:    z.string().email(),
  password: z.string().min(8),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }, { status: 500 })
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { empresa, nombre, rol, email, password } = parsed.data
  const supabase = getAdminClient()

  // Verificar que el email no existe
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
  }

  // 1. Crear empresa
  const { data: empresaData, error: empresaError } = await supabase
    .from("empresas")
    .insert({ nombre: empresa })
    .select("id")
    .single()

  if (empresaError || !empresaData) {
    return NextResponse.json({ error: "Error al crear la empresa" }, { status: 500 })
  }

  // 2. Crear usuario en auth
  const { data, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })

  if (createError) {
    await supabase.from("empresas").delete().eq("id", empresaData.id)
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // 3. Crear/actualizar perfil con empresa_id, rol y nombre
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: data.user.id, email, rol, nombre, empresa_id: empresaData.id, activo: true },
      { onConflict: "id" }
    )

  if (profileError) {
    console.error("[/api/auth/register] profile upsert error:", profileError)
  }

  return NextResponse.json({ success: true })
}
