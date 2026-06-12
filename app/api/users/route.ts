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

  const { nombre, email, rol } = await req.json()
  if (!email || !rol) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const supabase = getAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // Check existing user via profiles table (service role bypasses RLS)
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
    // Re-invite: user already exists, just update their profile and generate a new link
    userId = existingProfile.id
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ rol, nombre: nombre ?? "" })
      .eq("id", userId)
    if (updateErr) console.error("[/api/users] profile update error:", updateErr)
  } else {
    // New user — create auth account
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nombre: nombre ?? "", rol },
    })

    if (createError) {
      console.error("[/api/users] createUser error:", createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    userId = data.user.id

    // Upsert profile in case the trigger didn't run or ran with stale data
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, rol, nombre: nombre ?? "" }, { onConflict: "id" })
    if (upsertErr) console.error("[/api/users] profile upsert error:", upsertErr)
  }

  // Generate one-time activation link the admin shares manually
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }, { status: 500 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
