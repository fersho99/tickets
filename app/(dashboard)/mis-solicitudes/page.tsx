"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
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

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return iso }
}

export default function MisSolicitudesPage() {
  const { user } = useAuth()
  const { tickets, perfiles } = useData()

  const devName = (id?: string | null, stored?: string | null) => {
    if (stored) return stored
    if (!id) return "—"
    return perfiles.find((p) => p.id === id)?.nombre ?? "—"
  }

  const userTickets = tickets.filter((t) => t.solicitante_id === user?.id)

  const stats = {
    total: userTickets.length,
    abiertos: userTickets.filter((t) => t.estado === "en_revision" || t.estado === "aprobado").length,
    en_progreso: userTickets.filter((t) => t.estado === "en_progreso").length,
    resueltos: userTickets.filter((t) => t.estado === "corregido" || t.estado === "cerrado").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Solicitudes</h1>
          <p className="text-muted-foreground">Historial de tickets que has creado</p>
        </div>
        <Button asChild>
          <Link href="/nuevo-ticket">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{stats.en_progreso}</p>
          <p className="text-xs text-muted-foreground mt-1">En progreso</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{stats.resueltos}</p>
          <p className="text-xs text-muted-foreground mt-1">Resueltos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas mis solicitudes</CardTitle>
          <CardDescription>Haz clic en una fila para ver el detalle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No tienes tickets creados.{" "}
                      <Link href="/nuevo-ticket" className="text-primary hover:underline">
                        Crear uno ahora
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  userTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => window.location.href = `/tickets/${ticket.id}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{ticket.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">{ticket.titulo}</TableCell>
                      <TableCell className="capitalize">{ticket.tipo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadgeStyles[ticket.estado]}>
                          {estadoLabels[ticket.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>{devName(ticket.developer_id, ticket.developer_nombre)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(ticket.fecha_creacion)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
