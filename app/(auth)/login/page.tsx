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
      const home = ROLE_HOME[user.rol] ?? "/dashboard"
      const returnUrl = typeof window !== "undefined"
        ? sessionStorage.getItem("returnUrl")
        : null
      if (returnUrl) sessionStorage.removeItem("returnUrl")
      // Only use returnUrl if it doesn't belong to another role's home
      const otherHomes = Object.values(ROLE_HOME).filter((r) => r !== home)
      const safeReturn = returnUrl && !otherHomes.includes(returnUrl) ? returnUrl : null
      router.replace(safeReturn ?? home)
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
