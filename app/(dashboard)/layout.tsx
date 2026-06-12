"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import type { UserRole } from "@/lib/types"

const ROLE_HOME: Record<UserRole, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

// Rutas exclusivas de un solo rol
const EXCLUSIVE: Record<string, UserRole> = {
  "/dashboard": "lider_ti",
  "/dashboard-ejecutivo": "admin",
  "/mi-tablero": "developer",
  "/mis-solicitudes": "staff",
  "/nuevo-ticket": "staff",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("returnUrl", window.location.pathname)
      }
      router.replace("/login")
      return
    }

    // Redirigir si la ruta es exclusiva de otro rol
    const requiredRole = EXCLUSIVE[pathname]
    console.log("[layout guard]", { pathname, rol: user.rol, requiredRole })
    if (requiredRole && user.rol !== requiredRole) {
      console.log("[layout guard] redirigiendo a", ROLE_HOME[user.rol])
      router.replace(ROLE_HOME[user.rol])
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return <DashboardLayout>{children}</DashboardLayout>
}
