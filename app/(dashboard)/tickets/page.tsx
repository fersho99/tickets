"use client"

import Link from "next/link"
import { CheckCircle, Clock, AlertCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { ticketEstadoBadge, ticketEstadoLabel } from "@/lib/constants"

export default function TicketsPage() {
  const { tickets, updateTicket, developers } = useData()

  const stats = {
    total: tickets.length,
    en_revision: tickets.filter((t) => t.estado === "en_revision").length,
    en_progreso: tickets.filter((t) => t.estado === "en_progreso").length,
    corregido: tickets.filter((t) => t.estado === "corregido").length,
  }

  const handleAssignDeveloper = (ticketId: string, developerId: string) => {
    const developer = developers.find((d) => d.id === developerId)
    updateTicket(ticketId, { developer_id: developerId, developer_nombre: developer?.nombre })
  }

  const handleApproveTicket = (ticketId: string) => {
    updateTicket(ticketId, { estado: "aprobado" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestor de Tickets</h1>
        <p className="text-muted-foreground">Administra y asigna tickets a tu equipo</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.en_revision}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.en_progreso}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corregidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.corregido}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Tickets</CardTitle>
          <CardDescription>Gestiona y asigna tickets a desarrolladores</CardDescription>
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
                  <TableHead>Developer</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                        <p className="font-medium">{ticket.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{ticket.descripcion}</p>
                      </Link>
                    </TableCell>
                    <TableCell>{ticket.solicitante_nombre}</TableCell>
                    <TableCell className="capitalize">{ticket.tipo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ticketEstadoBadge[ticket.estado]}>
                        {ticketEstadoLabel[ticket.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.developer_id ?? ""}
                        onValueChange={(v) => handleAssignDeveloper(ticket.id, v)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {developers.map((dev) => (
                            <SelectItem key={dev.id} value={dev.id}>{dev.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {ticket.estado === "en_revision" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveTicket(ticket.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aprobar
                        </Button>
                      ) : (
                        <Badge variant="outline" className={`text-xs ${ticketEstadoBadge[ticket.estado]}`}>
                          {ticketEstadoLabel[ticket.estado]}
                        </Badge>
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
