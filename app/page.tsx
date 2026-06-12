"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const ROLE_HOME: Record<string, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(ROLE_HOME[user.rol] ?? "/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [user, isLoading, router])

  return null
}
