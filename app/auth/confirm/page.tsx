"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"

const confirmSchema = z
  .object({
    password:        z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ConfirmForm = z.infer<typeof confirmSchema>

const ROL_LABELS: Record<string, string> = {
  lider_ti:  "Líder de TI",
  admin:     "Administrador",
  developer: "Desarrollador",
  staff:     "Staff",
}

interface PerfilData {
  nombre:  string
  rol:     string
  empresa: string | null
}

export default function ConfirmPage() {
  const router = useRouter()
  const [email,       setEmail]       = useState<string | null>(null)
  const [perfil,      setPerfil]      = useState<PerfilData | null>(null)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [linkError,   setLinkError]   = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done,        setDone]        = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
  })

  useEffect(() => {
    const supabase = createClient()

    const exchangeToken = async () => {
      let uid: string | null = null

      // 1. Implicit flow
      const hash = window.location.hash
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken  = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken, refresh_token: refreshToken,
          })
          if (!error && data.session?.user) {
            setEmail(data.session.user.email ?? null)
            uid = data.session.user.id
          }
        }
      }

      // 2. PKCE flow
      if (!uid) {
        const params    = new URLSearchParams(window.location.search)
        const tokenHash = params.get("token_hash")
        const type      = params.get("type")
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: type as any,
          })
          if (!error && data.session?.user) {
            setEmail(data.session.user.email ?? null)
            uid = data.session.user.id
          }
        }
      }

      if (!uid) {
        setLinkError("El enlace de activación no es válido o ha expirado.")
        setLoading(false)
        return
      }

      setUserId(uid)

      // 3. Obtener datos del perfil (nombre, rol, empresa)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nombre, rol, empresa:empresas(nombre)")
        .eq("id", uid)
        .single()

      if (profileData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = profileData.empresa as any
        const empresaNombre: string | null = Array.isArray(raw)
          ? (raw[0]?.nombre ?? null)
          : (raw?.nombre ?? null)
        setPerfil({
          nombre:  profileData.nombre ?? "",
          rol:     profileData.rol    ?? "",
          empresa: empresaNombre,
        })
      }

      setLoading(false)
    }

    exchangeToken()
  }, [])

  const onSubmit = async (data: ConfirmForm) => {
    setSubmitError(null)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
    if (updateError) {
      setSubmitError(updateError.message)
      return
    }

    if (userId) {
      await supabase.from("profiles").update({ activo: true }).eq("id", userId)
    }

    setDone(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push("/login"), 2200)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (linkError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <p className="text-sm text-destructive">{linkError}</p>
            <Button asChild variant="outline">
              <Link href="/login">Volver al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">¡Cuenta activada!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirigiendo al inicio de sesión…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HuntersTrack AI</h1>
            <p className="text-sm text-muted-foreground mt-1">Has sido invitado a unirte al equipo</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Completa tu registro</CardTitle>
            <CardDescription>
              Activando cuenta para{" "}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Información pre-llenada (solo lectura) */}
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tu información (asignada por el administrador)
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Nombre</p>
                  <p className="font-medium">{perfil?.nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Rol</p>
                  <Badge variant="outline">
                    {ROL_LABELS[perfil?.rol ?? ""] ?? perfil?.rol ?? "—"}
                  </Badge>
                </div>
                {perfil?.empresa && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Empresa</p>
                    <p className="font-medium">{perfil.empresa}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Solo contraseña */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Contraseña nueva
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {submitError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {submitError}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? "Activando cuenta…" : "Activar mi cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
