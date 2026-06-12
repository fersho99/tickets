"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import type { EstadoTicket } from "@/lib/types"

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

// Load indicator: color based on number of active tickets
function loadColor(count: number) {
  if (count === 0) return { bar: "bg-green-500", text: "text-green-600 dark:text-green-400", label: "Disponible" }
  if (count <= 2) return { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "Carga baja" }
  if (count <= 4) return { bar: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400", label: "Carga media" }
  return { bar: "bg-red-500", text: "text-red-500", label: "Alta carga" }
}

export default function AsignarTareasPage() {
  const { tickets, updateTicket, developers } = useData()

  const activeStates: EstadoTicket[] = ["aprobado", "en_progreso", "en_revision"]

  const unassigned = tickets.filter(
    (t) => !t.developer_id && t.estado !== "corregido" && t.estado !== "cerrado"
  )
  const assigned = tickets.filter(
    (t) => t.developer_id && t.estado !== "corregido" && t.estado !== "cerrado"
  )

  // Total active tickets per developer, sorted ascending (least loaded first)
  const devWorkload = developers
    .map((dev) => ({
      ...dev,
      active: tickets.filter(
        (t) => t.developer_id === dev.id && activeStates.includes(t.estado as EstadoTicket)
      ).length,
    }))
    .sort((a, b) => a.active - b.active)

  const maxLoad = Math.max(...devWorkload.map((d) => d.active), 1)

  const handleAssign = (ticketId: string, developerId: string) => {
    const dev = developers.find((d) => d.id === developerId)
    updateTicket(ticketId, { developer_id: developerId, developer_nombre: dev?.nombre, estado: "aprobado" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asignar Tareas</h1>
        <p className="text-muted-foreground">Asigna tickets sin developer a tu equipo</p>
      </div>

      {/* Developer workload — compact grid, sorted by load ascending */}
      {devWorkload.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Carga del equipo — ordenado de menor a mayor
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {devWorkload.map((dev) => {
              const load = loadColor(dev.active)
              const pct = Math.round((dev.active / maxLoad) * 100)
              return (
                <div key={dev.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-card">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                    {dev.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{dev.nombre}</p>
                    {dev.active === 0 ? (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-600 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Disponible
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${load.bar}`}
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          />
                        </div>
                        <span className={`text-xs shrink-0 ${load.text}`}>
                          {dev.active} {dev.active === 1 ? "ticket" : "tickets"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unassigned Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Sin Developer ({unassigned.length})</CardTitle>
          <CardDescription>Tickets que necesitan ser asignados</CardDescription>
        </CardHeader>
        <CardContent>
          {unassigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <div>
                <p className="font-medium">¡Todo al día!</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Todos los tickets activos tienen developer asignado.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asignar a</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassigned.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                          {ticket.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>{ticket.solicitante_nombre}</TableCell>
                      <TableCell className="capitalize">{ticket.tipo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadgeStyles[ticket.estado]}>
                          {estadoLabels[ticket.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(v) => handleAssign(ticket.id, v)}>
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Show developers ordered by load so lightest-loaded appears first */}
                            {devWorkload.map((dev) => (
                              <SelectItem key={dev.id} value={dev.id}>
                                <span className="flex items-center gap-2">
                                  {dev.nombre}
                                  <span className="text-xs text-muted-foreground">({dev.active})</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Already Assigned */}
      {assigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asignados y Activos ({assigned.length})</CardTitle>
            <CardDescription>Tickets en curso con developer asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Reasignar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assigned.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                          {ticket.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>{ticket.developer_nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadgeStyles[ticket.estado]}>
                          {estadoLabels[ticket.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={ticket.developer_id ?? ""} onValueChange={(v) => handleAssign(ticket.id, v)}>
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {devWorkload.map((dev) => (
                              <SelectItem key={dev.id} value={dev.id}>
                                <span className="flex items-center gap-2">
                                  {dev.nombre}
                                  <span className="text-xs text-muted-foreground">({dev.active})</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
