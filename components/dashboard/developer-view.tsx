"use client"

import { Clock, CheckCircle, AlertCircle, Code } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { mockTickets, mockProyectos } from "@/lib/mock-data"
import type { EstadoTicket, EstadoProyecto } from "@/lib/types"

const ticketEstadoBadgeStyles: Record<EstadoTicket, string> = {
  en_revision: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  aprobado: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  en_progreso: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  corregido: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
}

const ticketEstadoLabels: Record<EstadoTicket, string> = {
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  en_progreso: "En Progreso",
  corregido: "Corregido",
}

const proyectoEstadoLabels: Record<EstadoProyecto, string> = {
  propuesta: "Propuesta",
  en_desarrollo: "En Desarrollo",
}

const proyectoEstadoBadgeStyles: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  en_desarrollo: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

export function DeveloperView() {
  const { user } = useAuth()

  // Get tickets assigned to this developer
  const myTickets = mockTickets.filter(
    (ticket) => ticket.developer_id === user?.id
  )

  // Group tickets by status for Kanban
  const kanbanColumns = {
    aprobado: myTickets.filter((t) => t.estado === "aprobado"),
    en_progreso: myTickets.filter((t) => t.estado === "en_progreso"),
    corregido: myTickets.filter((t) => t.estado === "corregido"),
  }

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
        <p className="text-muted-foreground">
          Gestiona tus tickets y proyectos asignados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignados</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_progreso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Tablero Kanban</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Aprobado Column */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <h3 className="font-medium">Aprobado</h3>
                <Badge variant="secondary" className="ml-auto">
                  {kanbanColumns.aprobado.length}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {kanbanColumns.aprobado.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin tickets
                </p>
              ) : (
                kanbanColumns.aprobado.map((ticket) => (
                  <Card key={ticket.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{ticket.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {ticket.descripcion}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={ticketEstadoBadgeStyles[ticket.estado]}
                        >
                          {ticketEstadoLabels[ticket.estado]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.tipo}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* En Progreso Column */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <h3 className="font-medium">En Progreso</h3>
                <Badge variant="secondary" className="ml-auto">
                  {kanbanColumns.en_progreso.length}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {kanbanColumns.en_progreso.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin tickets
                </p>
              ) : (
                kanbanColumns.en_progreso.map((ticket) => (
                  <Card key={ticket.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{ticket.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {ticket.descripcion}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={ticketEstadoBadgeStyles[ticket.estado]}
                        >
                          {ticketEstadoLabels[ticket.estado]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.tipo}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Corregido Column */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h3 className="font-medium">Corregido</h3>
                <Badge variant="secondary" className="ml-auto">
                  {kanbanColumns.corregido.length}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {kanbanColumns.corregido.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin tickets
                </p>
              ) : (
                kanbanColumns.corregido.map((ticket) => (
                  <Card key={ticket.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{ticket.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {ticket.descripcion}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={ticketEstadoBadgeStyles[ticket.estado]}
                        >
                          {ticketEstadoLabels[ticket.estado]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.tipo}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Projects */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Mis Proyectos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mockProyectos.slice(0, 2).map((proyecto) => (
            <Card key={proyecto.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{proyecto.nombre}</CardTitle>
                  <Badge
                    variant="outline"
                    className={proyectoEstadoBadgeStyles[proyecto.estado]}
                  >
                    {proyectoEstadoLabels[proyecto.estado]}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {proyecto.descripcion}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{proyecto.progreso}%</span>
                  </div>
                  <Progress value={proyecto.progreso} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
