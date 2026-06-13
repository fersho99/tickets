"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Clock, User, Tag, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase"
import type { Comentario, EstadoTicket } from "@/lib/types"
import { ticketEstadoBadge, ticketEstadoLabel, prioridadBadge, prioridadLabel } from "@/lib/constants"

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { tickets, updateTicket, developers, perfiles } = useData()
  const { user } = useAuth()
  const [comentario, setComentario] = useState("")
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [submitting, setSubmitting] = useState(false)

  const ticket = tickets.find((t) => t.id === id)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("ticket_comments")
      .select("*, author:profiles!author_id(nombre)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComentarios(
            data.map((row) => ({
              id: row.id,
              ticket_id: row.ticket_id,
              author_id: row.author_id,
              author_nombre: (row.author as { nombre: string } | null)?.nombre ?? "—",
              contenido: row.contenido,
              fecha_creacion: row.created_at,
            }))
          )
        }
      })
  }, [id])

  const resolveAuthorName = (authorId: string, stored: string) => {
    if (stored && stored !== "—") return stored
    if (authorId === user?.id) return user.nombre
    return perfiles.find((p) => p.id === authorId)?.nombre ?? "—"
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/tickets"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
        <p className="text-muted-foreground">Ticket no encontrado.</p>
      </div>
    )
  }

  const canChangeState = user?.rol === "lider_ti" || user?.rol === "developer"
  const canAssign = user?.rol === "lider_ti"

  const handleAddComentario = async () => {
    if (!comentario.trim() || !user) return
    setSubmitting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("ticket_comments")
      .insert({ ticket_id: id, author_id: user.id, contenido: comentario.trim() })
      .select("*, author:profiles!author_id(nombre)")
      .single()
    if (data) {
      setComentarios((prev) => [
        ...prev,
        {
          id: data.id,
          ticket_id: data.ticket_id,
          author_id: data.author_id,
          author_nombre: (data.author as { nombre: string } | null)?.nombre ?? user.nombre,
          contenido: data.contenido,
          fecha_creacion: data.created_at,
        },
      ])
    }
    setComentario("")
    setSubmitting(false)
  }

  const nextEstados: Partial<Record<EstadoTicket, EstadoTicket>> = {
    en_revision: "aprobado",
    aprobado: "en_progreso",
    en_progreso: "corregido",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets"><ArrowLeft className="mr-2 h-4 w-4" />Tickets</Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-sm text-muted-foreground">#{ticket.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl leading-tight">{ticket.titulo}</CardTitle>
                <div className="flex gap-2 shrink-0">
                  <Badge variant="outline" className={prioridadBadge[ticket.prioridad]}>
                    {prioridadLabel[ticket.prioridad]}
                  </Badge>
                  <Badge variant="outline" className={ticketEstadoBadge[ticket.estado]}>
                    {ticketEstadoLabel[ticket.estado]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{ticket.descripcion}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="capitalize">{ticket.tipo}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{ticket.solicitante_nombre}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(ticket.fecha_creacion).toLocaleDateString("es")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Comentarios ({comentarios.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scrollable comments list */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {comentarios.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
                )}
                {comentarios.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{resolveAuthorName(c.author_id, c.author_nombre)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.fecha_creacion).toLocaleDateString("es")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.contenido}</p>
                  </div>
                ))}
              </div>
              {/* Input always visible, outside scroll area */}
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  placeholder="Añadir un comentario..."
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleAddComentario}
                  disabled={!comentario.trim() || submitting}
                >
                  {submitting ? "Enviando..." : "Comentar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {canAssign && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Asignar Developer</p>
                  <Select
                    value={ticket.developer_id ?? ""}
                    onValueChange={(v) => {
                      const dev = developers.find((d) => d.id === v)
                      updateTicket(ticket.id, { developer_id: v, developer_nombre: dev?.nombre })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>{dev.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {canChangeState && nextEstados[ticket.estado] && (
                <Button
                  className="w-full"
                  onClick={() => updateTicket(ticket.id, { estado: nextEstados[ticket.estado]! })}
                >
                  Mover a: {ticketEstadoLabel[nextEstados[ticket.estado]!]}
                </Button>
              )}
              {user?.rol === "developer" && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/mi-tablero">
                    <LayoutDashboard className="h-4 w-4" />
                    Ver en Mi Tablero
                  </Link>
                </Button>
              )}
              {canChangeState && !nextEstados[ticket.estado] && user?.rol !== "lider_ti" && (
                <p className="text-xs text-center text-muted-foreground py-1">
                  Ticket {ticketEstadoLabel[ticket.estado].toLowerCase()} · sin acciones pendientes
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Developer asignado</p>
                <p className="font-medium">{ticket.developer_nombre ?? "Sin asignar"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="font-medium">{new Date(ticket.fecha_actualizacion).toLocaleDateString("es")}</p>
              </div>
              {ticket.proyecto_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Proyecto</p>
                  <Link href={`/proyectos/${ticket.proyecto_id}`} className="font-medium text-primary hover:underline text-sm">
                    Ver proyecto
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
