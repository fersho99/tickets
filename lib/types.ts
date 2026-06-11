// Types matching PostgreSQL database schema

export type UserRole = "lider_ti" | "admin" | "developer" | "staff"

export type EstadoProyecto = "propuesta" | "en_desarrollo"

export type EstadoTicket = "en_revision" | "aprobado" | "en_progreso" | "corregido"

export type TipoTicket = "soporte" | "mantenimiento"

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
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Ticket {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoTicket
  estado: EstadoTicket
  solicitante_id: string
  solicitante_nombre: string
  developer_id?: string
  developer_nombre?: string
  proyecto_id?: string
  fecha_creacion: string
  fecha_actualizacion: string
}
