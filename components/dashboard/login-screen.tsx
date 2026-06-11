"use client"

import { Sparkles, Users, Shield, Code, Headphones } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

const roles: { role: UserRole; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    role: "lider_ti",
    label: "Líder de TI",
    description: "Acceso completo: Dashboard, Proyectos, Tickets, Configuración",
    icon: Shield,
  },
  {
    role: "admin",
    label: "Administrador",
    description: "Dashboard Ejecutivo, Proyectos y Reportes IA",
    icon: Users,
  },
  {
    role: "developer",
    label: "Desarrollador",
    description: "Mi Tablero Kanban y Mis Proyectos",
    icon: Code,
  },
  {
    role: "staff",
    label: "Staff",
    description: "Mis Solicitudes y Nuevo Ticket",
    icon: Headphones,
  },
]

export function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">HuntersTrack AI</CardTitle>
          <CardDescription>
            Selecciona un rol para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map(({ role, label, description, icon: Icon }) => (
            <Button
              key={role}
              variant="outline"
              className="h-auto w-full justify-start gap-4 p-4 text-left"
              onClick={() => login(role)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
