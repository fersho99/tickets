"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Plus, CheckCircle2, Lightbulb } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import type { TipoTicket } from "@/lib/types"

const TITULO_MAX = 50
const DESC_MAX   = 500

const ticketSchema = z.object({
  titulo:      z.string().min(10, "El título debe tener al menos 10 caracteres").max(TITULO_MAX, `Máximo ${TITULO_MAX} caracteres`),
  descripcion: z.string().min(20, "La descripción debe tener al menos 20 caracteres").max(DESC_MAX, `Máximo ${DESC_MAX} caracteres`),
  tipo:        z.enum(["soporte", "mantenimiento"] as const, { required_error: "Selecciona un tipo" }),
  prioridad:   z.enum(["1", "2", "3"] as const).default("2"),
  proyecto_id: z.string().optional(),
})

type TicketForm = z.infer<typeof ticketSchema>

const prioridadLabels: Record<string, string> = {
  "1": "Alta — bloquea mi trabajo",
  "2": "Media — afecta pero tengo alternativa",
  "3": "Baja — consulta o mejora menor",
}

export default function NuevoTicketPage() {
  const { user } = useAuth()
  const { addTicket, proyectos } = useData()
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingData, setPendingData] = useState<TicketForm | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    mode: "onChange",
    defaultValues: { prioridad: "2" },
  })

  const tituloVal      = watch("titulo")      ?? ""
  const descripcionVal = watch("descripcion") ?? ""

  const onSubmit = (data: TicketForm) => {
    setPendingData(data)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!pendingData || !user) return
    addTicket({
      id: `t${Date.now()}`,
      titulo: pendingData.titulo,
      descripcion: pendingData.descripcion,
      tipo: pendingData.tipo as TipoTicket,
      estado: "en_revision",
      prioridad: parseInt(pendingData.prioridad) as 1 | 2 | 3,
      solicitante_id: user.id,
      solicitante_nombre: user.nombre,
      proyecto_id: pendingData.proyecto_id || undefined,
      fecha_creacion: new Date().toISOString().split("T")[0],
      fecha_actualizacion: new Date().toISOString().split("T")[0],
    })
    setConfirmOpen(false)
    router.push("/mis-solicitudes")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mis-solicitudes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Mis Solicitudes
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Ticket
            </CardTitle>
            <CardDescription>Crea una solicitud de soporte o mantenimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="titulo">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-xs ${tituloVal.length > TITULO_MAX ? "text-destructive" : "text-muted-foreground"}`}>
                    {tituloVal.length}/{TITULO_MAX}
                  </span>
                </div>
                <Input
                  id="titulo"
                  placeholder="Describe brevemente el problema (mín. 10 caracteres)"
                  maxLength={TITULO_MAX}
                  {...register("titulo")}
                />
                {errors.titulo && (
                  <p className="text-xs text-destructive">{errors.titulo.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="descripcion">
                    Descripción <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-xs ${descripcionVal.length > DESC_MAX ? "text-destructive" : "text-muted-foreground"}`}>
                    {descripcionVal.length}/{DESC_MAX}
                  </span>
                </div>
                <Textarea
                  id="descripcion"
                  rows={5}
                  placeholder="Proporciona todos los detalles posibles sobre tu solicitud (mín. 20 caracteres)"
                  maxLength={DESC_MAX}
                  {...register("descripcion")}
                />
                {errors.descripcion && (
                  <p className="text-xs text-destructive">{errors.descripcion.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Tipo <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soporte">Soporte</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tipo && (
                    <p className="text-xs text-destructive">{errors.tipo.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Prioridad <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="prioridad"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                              Alta — urgente
                            </span>
                          </SelectItem>
                          <SelectItem value="2">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
                              Media — normal
                            </span>
                          </SelectItem>
                          <SelectItem value="3">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
                              Baja — sin urgencia
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Proyecto relacionado <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                <Controller
                  name="proyecto_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona si aplica" />
                      </SelectTrigger>
                      <SelectContent>
                        {proyectos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                ¿Qué incluir en tu solicitud?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Buen título</p>
                <p>"Error al generar facturas en módulo ventas" es más útil que "no funciona".</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Descripción completa</p>
                <p>Incluye cuándo ocurrió, qué pasos seguiste y si hay un mensaje de error exacto.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Prioridad</p>
                <ul className="space-y-1 mt-1">
                  <li><span className="text-red-500 font-medium">Alta:</span> bloquea tu trabajo de inmediato</li>
                  <li><span className="text-yellow-600 font-medium">Media:</span> afecta pero tienes alternativa</li>
                  <li><span className="text-muted-foreground font-medium">Baja:</span> mejora o consulta menor</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Tipo</p>
                <ul className="space-y-1">
                  <li><span className="font-medium">Soporte:</span> algo no funciona</li>
                  <li><span className="font-medium">Mantenimiento:</span> mejora o actualización</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Confirmar ticket
            </DialogTitle>
            <DialogDescription>
              ¿Deseas enviar esta solicitud? Quedará en estado <strong>En Revisión</strong> hasta
              que el equipo de TI la procese.
            </DialogDescription>
          </DialogHeader>
          {pendingData && (
            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
              <p><span className="font-medium">Título:</span> {pendingData.titulo}</p>
              <p><span className="font-medium">Tipo:</span> {pendingData.tipo}</p>
              <p><span className="font-medium">Prioridad:</span> {prioridadLabels[pendingData.prioridad]}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirm}>Sí, enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
