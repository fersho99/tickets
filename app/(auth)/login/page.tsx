"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginScreen } from "@/components/dashboard/login-screen"

const ROLE_HOME: Record<string, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROLE_HOME[user.rol] ?? "/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <LoginScreen />
}
