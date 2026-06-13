import type { EstadoTicket, EstadoProyecto } from "./types"

export const ticketEstadoBadge: Record<EstadoTicket, string> = {
  en_revision: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  aprobado: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  en_progreso: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  corregido: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  cerrado: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

export const ticketEstadoLabel: Record<EstadoTicket, string> = {
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  en_progreso: "En Progreso",
  corregido: "Corregido",
  cerrado: "Cerrado",
}

export const prioridadBadge: Record<number, string> = {
  1: "bg-red-500/15 text-red-600 border-red-500/20",
  2: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  3: "bg-gray-500/15 text-gray-600 border-gray-500/20",
}

export const prioridadLabel: Record<number, string> = { 1: "Alta", 2: "Media", 3: "Baja" }

export const proyectoEstadoBadge: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  en_desarrollo: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  completado: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  cancelado: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
}

export const proyectoEstadoLabel: Record<EstadoProyecto, string> = {
  propuesta: "Propuesta",
  en_desarrollo: "En Desarrollo",
  completado: "Completado",
  cancelado: "Cancelado",
}

export const proyectoEstadoDot: Record<EstadoProyecto, string> = {
  propuesta: "bg-orange-500",
  en_desarrollo: "bg-blue-500",
  completado: "bg-green-500",
  cancelado: "bg-red-400",
}
