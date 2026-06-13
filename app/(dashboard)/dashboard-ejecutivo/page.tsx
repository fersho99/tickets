"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, CheckCircle2, XCircle, FolderKanban, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useData } from "@/lib/data-context"
import { proyectoEstadoBadge, proyectoEstadoLabel } from "@/lib/constants"

export default function DashboardEjecutivoPage() {
  const { proyectos, updateProyecto, tickets } = useData()

  const chartData = proyectos.slice(0, 6).map((p) => ({
    name: p.nombre.length > 16 ? p.nombre.slice(0, 14) + "…" : p.nombre,
    progreso: p.progreso,
  }))

  const stats = {
    total: proyectos.length,
    en_desarrollo: proyectos.filter((p) => p.estado === "en_desarrollo").length,
    propuesta: proyectos.filter((p) => p.estado === "propuesta").length,
    aprobados: proyectos.filter((p) => p.aprobacion_ti && p.aprobacion_negocio).length,
    ticketsAbiertos: tickets.filter((t) => t.estado !== "corregido" && t.estado !== "cerrado").length,
  }

  const tasaAprobacion = stats.total > 0
    ? Math.round((stats.aprobados / stats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">Vista general de proyectos y aprobaciones</p>
        </div>
        <Button asChild>
          <Link href="/reportes-ia">
            <Sparkles className="mr-2 h-4 w-4" />
            Reportes IA
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-indigo-500/30 bg-indigo-500/4 dark:bg-indigo-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.propuesta} en propuesta</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/4 dark:bg-blue-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Desarrollo</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_desarrollo}</div>
            <p className="text-xs text-muted-foreground mt-1">proyectos activos</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/4 dark:bg-yellow-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ticketsAbiertos}</div>
            <p className="text-xs text-muted-foreground mt-1">requieren atención</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/4 dark:bg-green-500/6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Aprobación</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasaAprobacion}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.aprobados} de {stats.total} proyectos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Progreso por Proyecto</CardTitle>
            <CardDescription>Avance actual de cada proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-45 gap-2 text-center">
                <FolderKanban className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Sin proyectos para graficar</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={76} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Progreso"]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="progreso" fill="#6366f1" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Proyectos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/proyectos">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {proyectos.map((proyecto) => (
              <Card key={proyecto.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-tight">{proyecto.nombre}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 ${proyectoEstadoBadge[proyecto.estado]}`}>
                      {proyectoEstadoLabel[proyecto.estado]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{proyecto.progreso}%</span>
                    </div>
                    <Progress value={proyecto.progreso} className="h-1.5" />
                  </div>
                  <div className="flex gap-4">
                    {/* TI — solo lectura para admin */}
                    <span className={`flex items-center gap-1 text-xs ${proyecto.aprobacion_ti ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                      {proyecto.aprobacion_ti
                        ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                        : <XCircle className="h-3 w-3" />}
                      TI
                    </span>
                    {/* Negocio — editable por admin */}
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id={`neg-${proyecto.id}`}
                        checked={proyecto.aprobacion_negocio}
                        onCheckedChange={() => updateProyecto(proyecto.id, { aprobacion_negocio: !proyecto.aprobacion_negocio })}
                      />
                      <label htmlFor={`neg-${proyecto.id}`} className="flex items-center gap-1 cursor-pointer text-xs">
                        {proyecto.aprobacion_negocio
                          ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                          : <XCircle className="h-3 w-3 text-muted-foreground" />}
                        Negocio
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
