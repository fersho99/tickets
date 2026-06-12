"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Settings,
  Users,
  BarChart3,
  KanbanSquare,
  MessageSquarePlus,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  roles: UserRole[]
  highlight?: boolean
}

const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["lider_ti"] },
  { title: "Dashboard Ejecutivo", icon: BarChart3, href: "/dashboard-ejecutivo", roles: ["admin"] },
  { title: "Proyectos", icon: FolderKanban, href: "/proyectos", roles: ["lider_ti", "admin"] },
  { title: "Mis Proyectos", icon: FolderKanban, href: "/mis-proyectos", roles: ["developer"] },
  { title: "Tickets", icon: Ticket, href: "/tickets", roles: ["lider_ti"] },
  { title: "Mi Tablero", icon: KanbanSquare, href: "/mi-tablero", roles: ["developer"] },
  { title: "Mis Solicitudes", icon: Ticket, href: "/mis-solicitudes", roles: ["staff"] },
  { title: "Nuevo Ticket", icon: MessageSquarePlus, href: "/nuevo-ticket", roles: ["staff"], highlight: true },
  { title: "Asignar Tareas", icon: Users, href: "/asignar-tareas", roles: ["lider_ti"] },
  { title: "Reportes IA", icon: Sparkles, href: "/reportes-ia", roles: ["admin"] },
  { title: "Configuración", icon: Settings, href: "/configuracion", roles: ["lider_ti", "admin", "developer", "staff"] },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const filteredItems = navItems.filter((item) => item.roles.includes(user.rol))

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase()

  const getRoleLabel = (rol: UserRole): string => {
    const labels: Record<UserRole, string> = {
      lider_ti: "Líder de TI",
      admin: "Administrador",
      developer: "Desarrollador",
      staff: "Staff",
    }
    return labels[rol]
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">HuntersTrack AI</span>
            <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        item.highlight && !isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                          : ""
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {getInitials(user.nombre)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.nombre}</span>
            <span className="truncate text-xs text-muted-foreground">
              {getRoleLabel(user.rol)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
