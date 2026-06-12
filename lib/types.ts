// Types matching Supabase/PostgreSQL database schema

export type UserRole = "lider_ti" | "admin" | "developer" | "staff"

export type EstadoProyecto = "propuesta" | "en_desarrollo" | "completado" | "cancelado"

export type EstadoTicket = "en_revision" | "aprobado" | "en_progreso" | "corregido" | "cerrado"

export type TipoTicket = "soporte" | "mantenimiento"

export type Prioridad = 1 | 2 | 3 // 1=alta, 2=media, 3=baja

export interface Perfil {
  id: string
  nombre: string
  email: string
  rol: UserRole
  avatar?: string
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string
  estado: EstadoProyecto
  progreso: number
  aprobacion_ti: boolean
  aprobacion_negocio: boolean
  developer_ids: string[]
  created_by?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Ticket {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoTicket
  estado: EstadoTicket
  prioridad: Prioridad
  solicitante_id: string
  solicitante_nombre: string
  developer_id?: string
  developer_nombre?: string
  proyecto_id?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Comentario {
  id: string
  ticket_id: string
  author_id: string
  author_nombre: string
  contenido: string
  fecha_creacion: string
}

export interface HistorialTicket {
  id: string
  ticket_id: string
  changed_by: string
  changed_by_nombre: string
  campo: string
  valor_anterior?: string
  valor_nuevo?: string
  fecha_creacion: string
}

export interface Notificacion {
  id: string
  user_id: string
  titulo: string
  mensaje: string
  leida: boolean
  tipo?: "ticket_asignado" | "ticket_aprobado" | "ticket_actualizado" | "proyecto_actualizado"
  referencia_id?: string
  referencia_tipo?: "ticket" | "proyecto"
  fecha_creacion: string
}
