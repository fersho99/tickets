"use client"

import { Bell } from "lucide-react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "./app-sidebar"
import { ThemeToggle } from "./theme-toggle"
import { StaffView } from "./staff-view"
import { LiderTIView } from "./lider-ti-view"
import { AdminView } from "./admin-view"
import { DeveloperView } from "./developer-view"
import { useAuth } from "@/lib/auth-context"

export function DashboardLayout() {
  const { user } = useAuth()

  if (!user) return null

  const renderView = () => {
    switch (user.rol) {
      case "staff":
        return <StaffView />
      case "lider_ti":
        return <LiderTIView />
      case "admin":
        return <AdminView />
      case "developer":
        return <DeveloperView />
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-sm font-medium">
              {user.rol === "staff" && "Portal de Soporte"}
              {user.rol === "lider_ti" && "Gestión de TI"}
              {user.rol === "admin" && "Panel Ejecutivo"}
              {user.rol === "developer" && "Área de Desarrollo"}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notificaciones</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{renderView()}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
