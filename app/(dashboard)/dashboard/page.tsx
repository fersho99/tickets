"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Clock, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import type { EstadoTicket, Ticket } from "@/lib/types"

const estadoBadgeStyles: Record<EstadoTicket, string> = {
  en_revision: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  aprobado: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  en_progreso: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  corregido: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  cerrado: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const estadoLabels: Record<EstadoTicket, string> = {
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  en_progreso: "En Progreso",
  corregido: "Corregido",
  cerrado: "Cerrado",
}

function getWeeklyTickets(tickets: Ticket[]) {
  const now = new Date()
  const currentMonday = new Date(now)
  currentMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  currentMonday.setHours(0, 0, 0, 0)

  return Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(currentMonday)
    weekStart.setDate(currentMonday.getDate() - (5 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = tickets.filter((t) => {
      const d = new Date(t.fecha_creacion)
      return d >= weekStart && d < weekEnd
    }).length

    return { semana: i === 5 ? "Actual" : `S-${5 - i}`, tickets: count }
  })
}

const ROLE_HOME: Record<string, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

export default function DashboardPage() {
  const { tickets } = useData()
  const { user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authUser && authUser.rol !== "lider_ti") {
      router.replace(ROLE_HOME[authUser.rol] ?? "/dashboard")
    }
  }, [authUser, router])

  const stats = {
    total: tickets.length,
    en_revision: tickets.filter((t) => t.estado === "en_revision").length,
    en_progreso: tickets.filter((t) => t.estado === "en_progreso").length,
    corregido: tickets.filter((t) => t.estado === "corregido").length,
  }

  const chartData = getWeeklyTickets(tickets)

  const recentTickets = [...tickets]
    .sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion))
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vista general de tu equipo de TI</p>
      </div>

      {/* KPI Cards — color accent per status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">En el sistema</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/4 dark:bg-yellow-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">En Revisión</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/15">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.en_revision}</div>
            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/60 mt-1">Pendientes de aprobar</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/4 dark:bg-purple-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">En Progreso</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15">
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.en_progreso}</div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/60 mt-1">Siendo trabajados</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/4 dark:bg-green-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Corregidos</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.corregido}</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/60 mt-1">Completados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart — indigo bars with proper contrast */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Semana</CardTitle>
            <CardDescription>Actividad de las últimas 6 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Tickets Recientes</CardTitle>
              <CardDescription>Últimas actualizaciones</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tickets">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ticket.titulo}</p>
                    <p className="text-xs text-muted-foreground">{ticket.solicitante_nombre}</p>
                  </div>
                  <Badge variant="outline" className={`ml-2 shrink-0 ${estadoBadgeStyles[ticket.estado]}`}>
                    {estadoLabels[ticket.estado]}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/tickets">Gestionar Tickets</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/asignar-tareas">Asignar Tareas</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/proyectos">Ver Proyectos</Link>
        </Button>
      </div>
    </div>
  )
}
