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

  // Projects where developer has tickets OR is in developer_ids array
  const myProjectIds = new Set([
    ...tickets.filter((t) => t.developer_id === user.id && t.proyecto_id).map((t) => t.proyecto_id!),
    ...proyectos.filter((p) => (p.developer_ids ?? []).includes(user.id)).map((p) => p.id),
  ])
  const myProyectos = proyectos.filter((p) => myProjectIds.has(p.id))
  const otherProyectos = proyectos.filter((p) => !myProjectIds.has(p.id)).slice(0, 2)

  const getMyTicketsForProject = (projectId: string) =>
    tickets.filter((t) => t.developer_id === user.id && t.proyecto_id === projectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Proyectos</h1>
        <p className="text-muted-foreground">Proyectos en los que tienes tickets asignados</p>
      </div>

      {myProyectos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myProyectos.map((proyecto) => {
            const myTickets = getMyTicketsForProject(proyecto.id)
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
                        <span className="text-muted-foreground">Progreso general</span>
                        <span className="font-medium">{proyecto.progreso}%</span>
                      </div>
                      <Progress value={proyecto.progreso} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {myTickets.length} ticket{myTickets.length !== 1 ? "s" : ""} asignado{myTickets.length !== 1 ? "s" : ""} a ti
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No tienes proyectos con tickets asignados aún.</p>
      )}

      {otherProyectos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Otros proyectos activos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherProyectos.map((proyecto) => (
              <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
                <Card className="h-full opacity-75 transition-all hover:opacity-100 hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{proyecto.nombre}</CardTitle>
                      <Badge variant="outline" className={`shrink-0 ${estadoBadgeStyles[proyecto.estado]}`}>
                        {estadoLabels[proyecto.estado]}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{proyecto.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{proyecto.progreso}%</span>
                      </div>
                      <Progress value={proyecto.progreso} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
