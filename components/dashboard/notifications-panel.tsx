"use client"

import { Bell, CheckCheck, Ticket, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import Link from "next/link"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  return `hace ${Math.floor(hrs / 24)} d`
}

export function NotificationsPanel() {
  const { user } = useAuth()
  const { notificaciones, markNotificacionLeida, markAllNotifsLeidas, unreadCount } = useData()

  if (!user) return null

  const userNotifs = notificaciones.filter((n) => n.user_id === user.id)
  const count = unreadCount(user.id)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
              {count}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <SheetTitle>Notificaciones</SheetTitle>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => markAllNotifsLeidas(user.id)}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {userNotifs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </p>
          ) : (
            <div className="space-y-2">
              {userNotifs.map((notif) => {
                const href = notif.referencia_tipo === "ticket" && notif.referencia_id
                  ? `/tickets/${notif.referencia_id}`
                  : notif.referencia_tipo === "project" && notif.referencia_id
                  ? `/proyectos/${notif.referencia_id}`
                  : null

                const inner = (
                  <div className="flex items-start gap-2">
                    {!notif.leida && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={!notif.leida ? "flex-1 min-w-0" : "pl-4 flex-1 min-w-0"}>
                      <p className="text-sm font-medium">{notif.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {notif.mensaje}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(notif.fecha_creacion)}
                      </p>
                    </div>
                  </div>
                )

                return href ? (
                  <Link
                    key={notif.id}
                    href={href}
                    onClick={() => markNotificacionLeida(notif.id)}
                    className={`block rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                      notif.leida ? "opacity-60" : "border-primary/20 bg-primary/5"
                    }`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={notif.id}
                    onClick={() => markNotificacionLeida(notif.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                      notif.leida ? "opacity-60" : "border-primary/20 bg-primary/5"
                    }`}
                  >
                    {inner}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
