"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import type { EstadoProyecto } from "@/lib/types"

const estadoLabels: Record<EstadoProyecto, string> = {
  propuesta: "Propuesta",
  en_desarrollo: "En Desarrollo",
  completado: "Completado",
  cancelado: "Cancelado",
}

const estadoBadgeStyles: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  en_desarrollo: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  completado: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  cancelado: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
}

export default function MisProyectosPage() {
  const { user } = useAuth()
  const { proyectos, tickets } = useData()

  if (!user) return null

  const isLider = user.rol === "lider_ti" || user.rol === "admin"

  // lider_ti y admin ven todos los proyectos; developer solo los asignados
  const visibleProyectos = isLider
    ? proyectos
    : proyectos.filter((p) => {
        const enDevIds = (p.developer_ids ?? []).includes(user.id)
        const tieneTicket = tickets.some((t) => t.developer_id === user.id && t.proyecto_id === p.id)
        return enDevIds || tieneTicket
      })

  const getTicketsForProject = (projectId: string) =>
    isLider
      ? tickets.filter((t) => t.proyecto_id === projectId)
      : tickets.filter((t) => t.developer_id === user.id && t.proyecto_id === projectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isLider ? "Proyectos" : "Mis Proyectos"}
        </h1>
        <p className="text-muted-foreground">
          {isLider
            ? `${visibleProyectos.length} proyecto${visibleProyectos.length !== 1 ? "s" : ""} en total`
            : "Proyectos en los que tienes tareas asignadas"}
        </p>
      </div>

      {visibleProyectos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleProyectos.map((proyecto) => {
            const proyectoTickets = getTicketsForProject(proyecto.id)
            return (
              <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{proyecto.nombre}</CardTitle>
                      <Badge variant="outline" className={`shrink-0 ${estadoBadgeStyles[proyecto.estado]}`}>
                        {estadoLabels[proyecto.estado]}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{proyecto.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{proyecto.progreso}%</span>
                      </div>
                      <Progress value={proyecto.progreso} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {proyectoTickets.length} tarea{proyectoTickets.length !== 1 ? "s" : ""}
                      {!isLider && " asignada" + (proyectoTickets.length !== 1 ? "s" : "") + " a ti"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {isLider ? "No hay proyectos creados aún." : "No tienes proyectos con tareas asignadas aún."}
        </p>
      )}
    </div>
  )
}
