"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"

const confirmSchema = z
  .object({
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ConfirmForm = z.infer<typeof confirmSchema>

export default function ConfirmPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) })

  useEffect(() => {
    const supabase = createClient()

    const exchangeToken = async () => {
      // Supabase invite links include token_hash + type as query params
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get("token_hash")
      const type = params.get("type")

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: type as any,
        })
        if (!error && data.session?.user?.email) {
          setEmail(data.session.user.email)
          setLoading(false)
          return
        }
      }

      // Fallback: session already established via hash fragment (implicit flow)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setEmail(session.user.email)
        setLoading(false)
        return
      }

      setLinkError("El enlace de invitación no es válido o ha expirado.")
      setLoading(false)
    }

    exchangeToken()
  }, [])

  const onSubmit = async (data: ConfirmForm) => {
    setSubmitError(null)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
      data: { nombre: data.nombre },
    })
    if (updateError) {
      setSubmitError(updateError.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({ nombre: data.nombre }).eq("id", user.id)
    }

    setDone(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push("/login"), 2200)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // ── Invalid link ─────────────────────────────────────────────────────────
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

  // ── Success ──────────────────────────────────────────────────────────────
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

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
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
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej. María García"
                  autoComplete="name"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña nueva</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
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
