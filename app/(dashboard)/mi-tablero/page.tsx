"use client"

import { Code, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanBoard } from "@/components/dashboard/kanban-board"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"

export default function MiTableroPage() {
  const { user } = useAuth()
  const { tickets } = useData()

  if (!user) return null

  const myTickets = tickets.filter((t) => t.developer_id === user.id)
  const stats = {
    total: myTickets.length,
    pendientes: myTickets.filter((t) => t.estado === "aprobado").length,
    en_progreso: myTickets.filter((t) => t.estado === "en_progreso").length,
    completados: myTickets.filter((t) => t.estado === "corregido").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Tablero</h1>
        <p className="text-muted-foreground">Gestiona tus tickets asignados — arrastra las tarjetas para cambiar estado</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignados</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pendientes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.en_progreso}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.completados}</div></CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Tablero Kanban</h2>
        <KanbanBoard userId={user.id} />
      </div>
    </div>
  )
}
