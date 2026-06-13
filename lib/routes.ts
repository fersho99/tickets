import type { UserRole } from "./types"

export const ROLE_HOME: Record<UserRole, string> = {
  lider_ti: "/dashboard",
  admin: "/dashboard-ejecutivo",
  developer: "/mi-tablero",
  staff: "/mis-solicitudes",
}

export const EXCLUSIVE: Record<string, UserRole> = {
  "/dashboard": "lider_ti",
  "/dashboard-ejecutivo": "admin",
  "/mi-tablero": "developer",
  "/mis-solicitudes": "staff",
  "/nuevo-ticket": "staff",
}
