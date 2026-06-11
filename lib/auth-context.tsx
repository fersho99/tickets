"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Perfil, UserRole } from "./types"
import { mockPerfiles } from "./mock-data"

interface AuthContextType {
  user: Perfil | null
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null)

  const login = (role: UserRole) => {
    const userByRole = mockPerfiles.find((p) => p.rol === role)
    if (userByRole) {
      setUser(userByRole)
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
