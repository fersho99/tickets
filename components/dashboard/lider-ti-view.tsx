"use client"

import { useState } from "react"
import { CheckCircle, Clock, AlertCircle, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockTickets, getDevelopers } from "@/lib/mock-data"
import type { EstadoTicket, Ticket } from "@/lib/types"

const estadoBadgeStyles: Record<EstadoTicket, string> = {
  en_revision: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  aprobado: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  en_progreso: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  corregido: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
}

const estadoLabels: Record<EstadoTicket, string> = {
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  en_progreso: "En Progreso",
  corregido: "Corregido",
}

export function LiderTIView() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const developers = getDevelopers()

  const stats = {
    total: tickets.length,
    en_revision: tickets.filter((t) => t.estado === "en_revision").length,
    en_progreso: tickets.filter((t) => t.estado === "en_progreso").length,
    corregido: tickets.filter((t) => t.estado === "corregido").length,
  }

  const handleAssignDeveloper = (ticketId: string, developerId: string) => {
    const developer = developers.find((d) => d.id === developerId)
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              developer_id: developerId,
              developer_nombre: developer?.nombre,
            }
          : ticket
      )
    )
    console.log("[v0] Assigned developer:", { ticketId, developerId })
  }

  const handleApproveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, estado: "aprobado" as EstadoTicket }
          : ticket
      )
    )
    console.log("[v0] Approved ticket:", ticketId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestor de Tickets</h1>
        <p className="text-muted-foreground">
          Administra y asigna tickets a tu equipo de desarrollo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_revision}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_progreso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corregidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.corregido}</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los Tickets</CardTitle>
          <CardDescription>
            Gestiona y asigna tickets a desarrolladores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignar Developer</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      {ticket.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.descripcion}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.solicitante_nombre}</TableCell>
                    <TableCell className="capitalize">{ticket.tipo}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={estadoBadgeStyles[ticket.estado]}
                      >
                        {estadoLabels[ticket.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.developer_id || ""}
                        onValueChange={(value) =>
                          handleAssignDeveloper(ticket.id, value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {developers.map((dev) => (
                            <SelectItem key={dev.id} value={dev.id}>
                              {dev.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {ticket.estado === "en_revision" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveTicket(ticket.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aprobar
                        </Button>
                      )}
                      {ticket.estado !== "en_revision" && (
                        <span className="text-xs text-muted-foreground">
                          {ticket.estado === "corregido" ? "Completado" : "En proceso"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
