"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { Perfil, UserRole } from "./types"
import { createClient } from "./supabase"
import { ROLE_HOME } from "./routes"

interface AuthContextType {
  user: Perfil | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        const profile = await fetchProfile(supabase, session.user.id)
        if (mounted) setUser(profile)
      }
      if (mounted) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      // Only react to explicit sign-out. SIGNED_IN is handled by getSession() on mount
      // and by login() directly — handling it here caused a re-render loop because the
      // middleware refreshes the token on every request, firing SIGNED_IN repeatedly.
      if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      if (data.user) {
        const profile = await fetchProfile(supabase, data.user.id)
        if (profile) setUser(profile)
      }
      return null
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
