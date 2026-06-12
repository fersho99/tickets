"use client"

import { useState } from "react"
import { Sparkles, CheckCircle2, XCircle, FolderKanban, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { mockProyectos } from "@/lib/mock-data"
import type { EstadoProyecto, Proyecto } from "@/lib/types"

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

export function AdminView() {
  const [proyectos, setProyectos] = useState<Proyecto[]>(mockProyectos)
  const [isGenerating, setIsGenerating] = useState(false)

  const stats = {
    total: proyectos.length,
    en_desarrollo: proyectos.filter((p) => p.estado === "en_desarrollo").length,
    propuesta: proyectos.filter((p) => p.estado === "propuesta").length,
    avgProgress: Math.round(
      proyectos.reduce((acc, p) => acc + p.progreso, 0) / proyectos.length
    ),
  }

  const handleToggleAprobacionTI = (proyectoId: string) => {
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyectoId ? { ...p, aprobacion_ti: !p.aprobacion_ti } : p
      )
    )
  }

  const handleToggleAprobacionNegocio = (proyectoId: string) => {
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyectoId
          ? { ...p, aprobacion_negocio: !p.aprobacion_negocio }
          : p
      )
    )
  }

  const handleGenerateReport = () => {
    setIsGenerating(true)
    console.log("[v0] Generating AI report with Claude...")
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false)
      console.log("[v0] AI report generated")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard Ejecutivo
        </h1>
        <p className="text-muted-foreground">
          Vista general de proyectos y aprobaciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Proyectos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Desarrollo</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_desarrollo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propuestas</CardTitle>
            <FolderKanban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propuesta}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progreso Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Lista de Proyectos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{proyecto.nombre}</CardTitle>
                  <Badge
                    variant="outline"
                    className={estadoBadgeStyles[proyecto.estado]}
                  >
                    {estadoLabels[proyecto.estado]}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {proyecto.descripcion}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{proyecto.progreso}%</span>
                  </div>
                  <Progress value={proyecto.progreso} className="h-2" />
                </div>

                {/* Approvals */}
                <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Autorizaciones
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`ti-${proyecto.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        {proyecto.aprobacion_ti ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        Aprobación TI
                      </label>
                      <Checkbox
                        id={`ti-${proyecto.id}`}
                        checked={proyecto.aprobacion_ti}
                        onCheckedChange={() =>
                          handleToggleAprobacionTI(proyecto.id)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`negocio-${proyecto.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        {proyecto.aprobacion_negocio ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        Aprobación Negocio
                      </label>
                      <Checkbox
                        id={`negocio-${proyecto.id}`}
                        checked={proyecto.aprobacion_negocio}
                        onCheckedChange={() =>
                          handleToggleAprobacionNegocio(proyecto.id)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Creado: {proyecto.fecha_creacion}</span>
                  <span>Actualizado: {proyecto.fecha_actualizacion}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating AI Report Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 gap-2 rounded-full px-6 shadow-lg"
        onClick={handleGenerateReport}
        disabled={isGenerating}
      >
        <Sparkles className={`h-5 w-5 ${isGenerating ? "animate-pulse" : ""}`} />
        {isGenerating ? "Generando..." : "Generar Reporte IA con Claude"}
      </Button>
    </div>
  )
}
