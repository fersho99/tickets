"use client"

import Link from "next/link"
import { Plus, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const estadoDot: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500",
  en_desarrollo: "bg-blue-500",
  completado: "bg-green-500",
  cancelado: "bg-red-400",
}

const nuevoPySchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres"),
  estado: z.enum(["propuesta", "en_desarrollo"]),
})

type NuevoProyectoForm = z.infer<typeof nuevoPySchema>

export default function ProyectosPage() {
  const { proyectos, addProyecto } = useData()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NuevoProyectoForm>({
    resolver: zodResolver(nuevoPySchema),
    defaultValues: { estado: "propuesta" },
  })

  const onSubmit = (data: NuevoProyectoForm) => {
    addProyecto({
      id: `p${Date.now()}`,
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estado,
      progreso: 0,
      aprobacion_ti: false,
      aprobacion_negocio: false,
      created_by: user?.id,
      fecha_creacion: new Date().toISOString().split("T")[0],
      fecha_actualizacion: new Date().toISOString().split("T")[0],
    })
    reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos de TI</p>
        </div>
        {user?.rol === "lider_ti" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto</DialogTitle>
                <DialogDescription>Crea un nuevo proyecto de TI</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" placeholder="Nombre del proyecto" {...register("nombre")} />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea id="descripcion" rows={3} placeholder="Describe el proyecto..." {...register("descripcion")} />
                  {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Estado inicial</Label>
                  <Select defaultValue="propuesta" onValueChange={(v) => setValue("estado", v as "propuesta" | "en_desarrollo")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propuesta">Propuesta</SelectItem>
                      <SelectItem value="en_desarrollo">En Desarrollo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Crear Proyecto</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((proyecto) => (
          <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{proyecto.nombre}</CardTitle>
                  <Badge variant="outline" className={`shrink-0 flex items-center gap-1.5 ${estadoBadgeStyles[proyecto.estado]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${estadoDot[proyecto.estado]}`} />
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
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {proyecto.aprobacion_ti
                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                      : <XCircle className="h-3 w-3" />}
                    TI
                  </span>
                  <span className="flex items-center gap-1">
                    {proyecto.aprobacion_negocio
                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                      : <XCircle className="h-3 w-3" />}
                    Negocio
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
