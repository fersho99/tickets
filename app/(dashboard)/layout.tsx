"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ROLE_HOME, EXCLUSIVE } from "@/lib/routes"

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

    const allowedRoles = EXCLUSIVE[pathname]
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
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

  const allowedRoles = EXCLUSIVE[pathname]
  if (allowedRoles && !allowedRoles.includes(user.rol)) return null

  return <DashboardLayout>{children}</DashboardLayout>
}
