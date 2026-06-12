"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { Perfil, UserRole } from "./types"
import { createClient } from "./supabase"

interface AuthContextType {
  user: Perfil | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const ROLE_HOME: Record<UserRole, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

async function fetchProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Perfil | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 6000)
    )
    const queryPromise = supabase
      .from("profiles")
      .select("id, nombre, email, rol, avatar_url")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return null
        return {
          id: data.id as string,
          nombre: data.nombre as string,
          email: data.email as string,
          rol: data.rol as UserRole,
          avatar: (data.avatar_url as string) ?? undefined,
        } satisfies Perfil
      })
    return await Promise.race([queryPromise, timeoutPromise])
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Use getSession() for initial load — reads from storage without waiting for token refresh events
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      console.log("[auth] getSession uid:", session?.user?.id ?? "null")
      if (session?.user) {
        const profile = await fetchProfile(supabase, session.user.id)
        console.log("[auth] getSession profile:", profile?.rol ?? "null")
        if (mounted) setUser(profile)
      }
      if (mounted) setIsLoading(false)
    })

    // Listen only for subsequent auth changes — ignore INITIAL_SESSION (handled above)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        console.log("[auth] onAuthStateChange event:", event, "uid:", session?.user?.id ?? "null")
        if (event === "SIGNED_OUT") {
          setUser(null)
          return
        }
        if (event === "SIGNED_IN" && session?.user) {
          const profile = await fetchProfile(supabase, session.user.id)
          console.log("[auth] SIGNED_IN profile:", profile?.rol ?? "null")
          if (mounted && profile) setUser(profile)
        }
        // TOKEN_REFRESHED / INITIAL_SESSION → keep existing user state
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Only calls signInWithPassword — navigation is handled by LoginPage's useEffect
  // when it detects user is set. This avoids a double-navigation race condition.
  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? error.message : null
    } catch (e) {
      return e instanceof Error ? e.message : "Error al iniciar sesión"
    }
  }

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
