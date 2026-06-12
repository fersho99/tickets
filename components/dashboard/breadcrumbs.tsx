"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useData } from "@/lib/data-context"

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Dashboard",
  "dashboard-ejecutivo": "Dashboard Ejecutivo",
  proyectos: "Proyectos",
  tickets: "Tickets",
  "asignar-tareas": "Asignar Tareas",
  configuracion: "Configuración",
  "reportes-ia": "Reportes IA",
  "mi-tablero": "Mi Tablero",
  "mis-proyectos": "Mis Proyectos",
  "mis-solicitudes": "Mis Solicitudes",
  "nuevo-ticket": "Nuevo Ticket",
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function Breadcrumbs() {
  const pathname = usePathname()
  const { tickets, proyectos } = useData()

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  function resolveLabel(segment: string, index: number): string {
    if (!UUID_RE.test(segment)) return ROUTE_NAMES[segment] ?? segment
    // Previous segment tells us what kind of entity this UUID is
    const parent = segments[index - 1]
    if (parent === "proyectos") {
      return proyectos.find((p) => p.id === segment)?.nombre ?? segment.slice(0, 8)
    }
    if (parent === "tickets") {
      const t = tickets.find((t) => t.id === segment)
      return t ? `#${t.id.slice(0, 8).toUpperCase()}` : segment.slice(0, 8)
    }
    return segment.slice(0, 8)
  }

  const crumbs = segments.map((segment, index) => ({
    href: "/" + segments.slice(0, index + 1).join("/"),
    label: resolveLabel(segment, index),
    isLast: index === segments.length - 1,
  }))

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">HuntersTrack AI</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
