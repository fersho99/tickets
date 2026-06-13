"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ROLE_HOME } from "@/lib/routes"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? (ROLE_HOME[user.rol] ?? "/dashboard") : "/login")
    }
  }, [user, isLoading, router])

  return null
}
