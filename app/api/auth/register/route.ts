import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local" },
      { status: 500 }
    )
  }

  const { nombre, email, password } = await req.json()

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const supabase = getAdminClient()

  // Check if this email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
  }

  // Create the user — new org admins are confirmed immediately
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol: "admin" },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Set role=admin on the profile row (trigger creates it with default role)
  await supabase
    .from("profiles")
    .update({ rol: "admin", nombre })
    .eq("id", data.user.id)

  return NextResponse.json({ success: true })
}
