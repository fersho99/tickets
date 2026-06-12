"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Bell, User, Users, UserPlus, Trash2, Copy, Check, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { createClient } from "@/lib/supabase"
import type { UserRole } from "@/lib/types"

const perfilSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
})

const nuevoUsuarioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  rol: z.enum(["lider_ti", "admin", "developer", "staff"]),
})

type PerfilForm = z.infer<typeof perfilSchema>
type NuevoUsuarioForm = z.infer<typeof nuevoUsuarioSchema>

const ROL_LABELS: Record<string, string> = {
  lider_ti: "Líder de TI",
  admin: "Administrador",
  developer: "Desarrollador",
  staff: "Staff",
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { perfiles, removePerfile } = useData()
  const router = useRouter()
  const canManageTeam = user?.rol === "lider_ti" || user?.rol === "admin"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activationLink, setActivationLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const perfilForm = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: user?.nombre ?? "", email: user?.email ?? "" },
  })

  const nuevoForm = useForm<NuevoUsuarioForm>({
    resolver: zodResolver(nuevoUsuarioSchema),
    defaultValues: { nombre: "", email: "", rol: "staff" },
  })

  const onGuardarPerfil = async (data: PerfilForm) => {
    if (!user) return
    const supabase = createClient()
    await supabase.from("profiles").update({ nombre: data.nombre }).eq("id", user.id)
    setSuccessMsg("Perfil actualizado")
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const onCrearUsuario = async (data: NuevoUsuarioForm) => {
    setServerError(null)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: data.nombre, email: data.email, rol: data.rol }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error ?? "Error al crear usuario")
      return
    }
    nuevoForm.reset()
    if (json.activationLink) {
      setActivationLink(json.activationLink)
    } else {
      setDialogOpen(false)
      router.refresh()
    }
  }

  const handleCopyLink = async () => {
    if (!activationLink) return
    await navigator.clipboard.writeText(activationLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleCloseInviteDialog = () => {
    setDialogOpen(false)
    setActivationLink(null)
    setLinkCopied(false)
    router.refresh()
  }

  const onEliminarUsuario = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setDeleteError(json.error ?? "Error al eliminar el usuario")
      return
    }
    removePerfile(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y preferencias del sistema</p>
      </div>

      {/* Mi Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mi Perfil
          </CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {user ? getInitials(user.nombre) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.nombre}</p>
              <Badge variant="secondary">{user ? ROL_LABELS[user.rol] : ""}</Badge>
            </div>
          </div>
          <form onSubmit={perfilForm.handleSubmit(onGuardarPerfil)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" {...perfilForm.register("nombre")} />
                {perfilForm.formState.errors.nombre && (
                  <p className="text-xs text-destructive">{perfilForm.formState.errors.nombre.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" disabled {...perfilForm.register("email")} />
                <p className="text-xs text-muted-foreground">El email no se puede cambiar aquí</p>
              </div>
            </div>
            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
            <Button type="submit" disabled={!perfilForm.formState.isDirty}>
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </CardTitle>
          <CardDescription>Controla qué notificaciones recibes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "n1", label: "Ticket asignado a developer", desc: "Cuando asignas un ticket" },
            { id: "n2", label: "Ticket aprobado", desc: "Cuando un ticket pasa a aprobado" },
            { id: "n3", label: "Cambios de estado", desc: "Cuando un ticket cambia de estado" },
            { id: "n4", label: "Proyectos", desc: "Cambios en proyectos que gestionas" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Equipo — solo lider_ti y admin */}
      {canManageTeam && <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipo
            </CardTitle>
            <CardDescription className="mt-1">Usuarios del sistema</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) handleCloseInviteDialog(); else setDialogOpen(true); setServerError(null) }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Nuevo miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full">
              {activationLink ? (
                /* Step 2 — show activation link */
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      Miembro creado
                    </DialogTitle>
                    <DialogDescription>
                      Comparte este enlace de activación con el nuevo miembro. Expira en 24 horas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="truncate text-xs text-muted-foreground">{activationLink}</p>
                    </div>
                    <Button className="w-full gap-2" onClick={handleCopyLink}>
                      {linkCopied ? <><Check className="h-4 w-4" />Copiado</> : <><Copy className="h-4 w-4" />Copiar enlace</>}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseInviteDialog}>Listo</Button>
                  </DialogFooter>
                </>
              ) : (
                /* Step 1 — create form */
                <>
              <DialogHeader>
                <DialogTitle>Invitar miembro</DialogTitle>
                <DialogDescription>La cuenta se crea de inmediato — comparte el enlace de activación con el usuario</DialogDescription>
              </DialogHeader>
              <form onSubmit={nuevoForm.handleSubmit(onCrearUsuario)} className="space-y-4">
                <div className="space-y-1">
                  <Label>Nombre completo</Label>
                  <Input placeholder="Juan Pérez" {...nuevoForm.register("nombre")} />
                  {nuevoForm.formState.errors.nombre && (
                    <p className="text-xs text-destructive">{nuevoForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" placeholder="juan@empresa.com" {...nuevoForm.register("email")} />
                  {nuevoForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{nuevoForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Rol</Label>
                  <Select
                    defaultValue="staff"
                    onValueChange={(v) => nuevoForm.setValue("rol", v as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {serverError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={nuevoForm.formState.isSubmitting}>
                    {nuevoForm.formState.isSubmitting ? "Enviando..." : "Enviar invitación"}
                  </Button>
                </DialogFooter>
              </form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {perfiles.map((perfil) => (
              <div key={perfil.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {getInitials(perfil.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{perfil.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{perfil.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {ROL_LABELS[perfil.rol]}
                  </Badge>
                  {perfil.id === user?.id && (
                    <Badge variant="secondary" className="text-xs">Tú</Badge>
                  )}
                </div>
                {perfil.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setDeleteTarget({ id: perfil.id, nombre: perfil.nombre })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            {perfiles.length} usuario{perfiles.length !== 1 ? "s" : ""} en el sistema.
          </p>
        </CardContent>
      </Card>}

      {/* Confirmar eliminación — solo visible para quienes pueden gestionar equipo */}
      {canManageTeam && <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {deleteTarget?.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuenta permanentemente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onEliminarUsuario}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  )
}
