"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Pencil, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import type { EstadoProyecto, EstadoTicket } from "@/lib/types"

const estadoBadgeStyles: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  en_desarrollo: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  completado: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  cancelado: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
}

const estadoLabels: Record<EstadoProyecto, string> = {
  propuesta: "Propuesta",
  en_desarrollo: "En Desarrollo",
  completado: "Completado",
  cancelado: "Cancelado",
}

const ticketEstadoStyles: Record<EstadoTicket, string> = {
  en_revision: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  aprobado: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  en_progreso: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  corregido: "bg-green-500/15 text-green-600 border-green-500/20",
  cerrado: "bg-gray-500/15 text-gray-600 border-gray-500/20",
}

const ticketEstadoLabels: Record<EstadoTicket, string> = {
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  en_progreso: "En Progreso",
  corregido: "Corregido",
  cerrado: "Cerrado",
}

export default function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { proyectos, tickets, developers, updateProyecto } = useData()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [editProgreso, setEditProgreso] = useState("")
  const [teamOpen, setTeamOpen] = useState(false)
  const [selectedDevIds, setSelectedDevIds] = useState<string[]>([])

  const proyecto = proyectos.find((p) => p.id === id)
  const proyectoTickets = tickets.filter((t) => t.proyecto_id === id)

  if (!proyecto) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/proyectos"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
        <p className="text-muted-foreground">Proyecto no encontrado.</p>
      </div>
    )
  }

  const handleEditProgreso = () => {
    const val = parseInt(editProgreso)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateProyecto(proyecto.id, { progreso: val })
      setEditOpen(false)
    }
  }

  const handleOpenTeam = () => {
    setSelectedDevIds(proyecto.developer_ids ?? [])
    setTeamOpen(true)
  }

  const handleSaveTeam = () => {
    updateProyecto(proyecto.id, { developer_ids: selectedDevIds })
    setTeamOpen(false)
  }

  const toggleDev = (id: string) => {
    setSelectedDevIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const assignedDevs = developers.filter((d) => (proyecto.developer_ids ?? []).includes(d.id))

  const canEdit = user?.rol === "lider_ti" || user?.rol === "admin"

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-ES", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    } catch { return iso }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proyectos"><ArrowLeft className="mr-2 h-4 w-4" />Proyectos</Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-xs">{proyecto.nombre}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{proyecto.nombre}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{proyecto.descripcion}</p>
                </div>
                <Badge variant="outline" className={estadoBadgeStyles[proyecto.estado]}>
                  {estadoLabels[proyecto.estado]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold">{proyecto.progreso}%</span>
                </div>
                <Progress value={proyecto.progreso} className="h-3" />
              </div>
              {canEdit && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditProgreso(String(proyecto.progreso))}>
                      <Pencil className="mr-2 h-3 w-3" />
                      Actualizar progreso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle>Actualizar Progreso</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label>Progreso (0–100)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={editProgreso}
                          onChange={(e) => setEditProgreso(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleEditProgreso}>Guardar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Associated Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets Asociados ({proyectoTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {proyectoTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin tickets asociados.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Developer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proyectoTickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">
                            {t.titulo}
                          </Link>
                        </TableCell>
                        <TableCell className="capitalize">{t.tipo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ticketEstadoStyles[t.estado]}>
                            {ticketEstadoLabels[t.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.developer_nombre ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Team */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Equipo ({assignedDevs.length})
                </CardTitle>
                {canEdit && (
                  <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenTeam}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Asignar Desarrolladores</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 pt-2 max-h-64 overflow-y-auto">
                        {developers.length === 0 && (
                          <p className="text-sm text-muted-foreground">No hay desarrolladores disponibles.</p>
                        )}
                        {developers.map((dev) => (
                          <label
                            key={dev.id}
                            className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              checked={selectedDevIds.includes(dev.id)}
                              onCheckedChange={() => toggleDev(dev.id)}
                            />
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {dev.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{dev.nombre}</p>
                              <p className="text-xs text-muted-foreground truncate">{dev.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setTeamOpen(false)}>
                          Cancelar
                        </Button>
                        <Button className="flex-1" onClick={handleSaveTeam}>
                          Guardar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedDevs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {canEdit ? "Haz clic en + para asignar developers." : "Sin developers asignados."}
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedDevs.map((dev) => (
                    <div key={dev.id} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {dev.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dev.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{dev.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aprobaciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* TI — editable solo por lider_ti */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {proyecto.aprobacion_ti
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-muted-foreground" />}
                  Aprobación TI
                </div>
                {user?.rol === "lider_ti" ? (
                  <Checkbox
                    id={`ti-${proyecto.id}`}
                    checked={proyecto.aprobacion_ti}
                    onCheckedChange={() => updateProyecto(proyecto.id, { aprobacion_ti: !proyecto.aprobacion_ti })}
                  />
                ) : (
                  <span className={`text-xs font-medium ${proyecto.aprobacion_ti ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {proyecto.aprobacion_ti ? "Aprobado" : "Pendiente"}
                  </span>
                )}
              </div>
              {/* Negocio — editable solo por admin */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {proyecto.aprobacion_negocio
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-muted-foreground" />}
                  Aprobación Negocio
                </div>
                {user?.rol === "admin" ? (
                  <Checkbox
                    id={`neg-${proyecto.id}`}
                    checked={proyecto.aprobacion_negocio}
                    onCheckedChange={() => updateProyecto(proyecto.id, { aprobacion_negocio: !proyecto.aprobacion_negocio })}
                  />
                ) : (
                  <span className={`text-xs font-medium ${proyecto.aprobacion_negocio ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {proyecto.aprobacion_negocio ? "Aprobado" : "Pendiente"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fecha de creación</p>
                <p className="font-medium">{formatDate(proyecto.fecha_creacion)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="font-medium">{formatDate(proyecto.fecha_actualizacion)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
