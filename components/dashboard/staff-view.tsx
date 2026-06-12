"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useAuth } from "@/lib/auth-context"
import { mockTickets } from "@/lib/mock-data"
import type { EstadoTicket, TipoTicket } from "@/lib/types"

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

export function StaffView() {
  const { user } = useAuth()
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<TipoTicket | "">("")

  const userTickets = mockTickets.filter(
    (ticket) => ticket.solicitante_id === user?.id
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submit - would send to API in real implementation
    console.log("[v0] Creating ticket:", { titulo, descripcion, tipo })
    setTitulo("")
    setDescripcion("")
    setTipo("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal de Soporte</h1>
        <p className="text-muted-foreground">
          Levanta tickets y da seguimiento a tus solicitudes
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Ticket Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Ticket
            </CardTitle>
            <CardDescription>
              Crea una nueva solicitud de soporte o mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Describe brevemente el problema"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Proporciona detalles adicionales sobre tu solicitud..."
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Ticket</Label>
                <Select
                  value={tipo}
                  onValueChange={(value) => setTipo(value as TipoTicket)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soporte">Soporte</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Crear Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions Card for Mobile */}
        <Card className="lg:hidden">
          <CardContent className="pt-6">
            <Button size="lg" className="w-full h-16 text-lg">
              <Plus className="mr-2 h-6 w-6" />
              Nuevo Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Solicitudes</CardTitle>
          <CardDescription>
            Historial de tickets que has creado
          </CardDescription>
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
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No tienes tickets creados
                    </TableCell>
                  </TableRow>
                ) : (
                  userTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">
                        {ticket.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ticket.titulo}
                      </TableCell>
                      <TableCell className="capitalize">{ticket.tipo}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estadoBadgeStyles[ticket.estado]}
                        >
                          {estadoLabels[ticket.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ticket.fecha_creacion}
                      </TableCell>
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
