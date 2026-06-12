"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { Ticket, Proyecto, Notificacion, Perfil } from "./types"
import { createClient } from "./supabase"

// ─── localStorage cache (stale-while-revalidate) ─────────────────────────────

const CACHE_VERSION = 2
const CACHE_TTL_MS  = 5 * 60 * 1000   // 5 min — silently revalidate after this

interface CacheEntry {
  v: number
  tickets: Ticket[]
  proyectos: Proyecto[]
  notificaciones: Notificacion[]
  perfiles: Perfil[]
  at: number
}

const cacheKey = (uid: string) => `ht_data_${uid}`

function readCache(uid: string): CacheEntry | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (entry.v !== CACHE_VERSION) return null
    return entry
  } catch { return null }
}

function writeCache(uid: string, data: Omit<CacheEntry, "v" | "at">) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify({ v: CACHE_VERSION, at: Date.now(), ...data }))
  } catch {} // quota exceeded — ignore
}

function clearCache(uid: string) {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(cacheKey(uid)) } catch {}
}

// ─── Context types ────────────────────────────────────────────────────────────

interface DataContextType {
  tickets: Ticket[]
  proyectos: Proyecto[]
  notificaciones: Notificacion[]
  perfiles: Perfil[]
  developers: Perfil[]
  isLoading: boolean
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>
  addTicket: (ticket: Ticket) => Promise<void>
  updateProyecto: (id: string, updates: Partial<Proyecto>) => Promise<void>
  addProyecto: (proyecto: Proyecto) => Promise<void>
  markNotificacionLeida: (id: string) => Promise<void>
  markAllNotifsLeidas: (userId: string) => Promise<void>
  unreadCount: (userId: string) => number
}

const DataContext = createContext<DataContextType | null>(null)

// ─── Row mappers ──────────────────────────────────────────────────────────────

function mapTicket(row: Record<string, unknown>): Ticket {
  const sol = row.solicitante as { nombre: string } | null
  const dev = row.developer as { nombre: string } | null
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    descripcion: row.descripcion as string,
    tipo: row.tipo as Ticket["tipo"],
    estado: row.estado as Ticket["estado"],
    prioridad: row.prioridad as Ticket["prioridad"],
    solicitante_id: row.solicitante_id as string,
    solicitante_nombre: sol?.nombre ?? "—",
    developer_id: (row.developer_id as string) ?? undefined,
    developer_nombre: dev?.nombre ?? undefined,
    proyecto_id: (row.proyecto_id as string) ?? undefined,
    fecha_creacion: row.created_at as string,
    fecha_actualizacion: row.updated_at as string,
  }
}

function mapProyecto(row: Record<string, unknown>): Proyecto {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: (row.descripcion as string) ?? "",
    estado: row.estado as Proyecto["estado"],
    progreso: row.progreso as number,
    aprobacion_ti: row.aprobacion_ti as boolean,
    aprobacion_negocio: row.aprobacion_negocio as boolean,
    developer_ids: Array.isArray(row.developer_ids) ? (row.developer_ids as string[]) : [],
    created_by: (row.created_by as string) ?? undefined,
    fecha_creacion: row.created_at as string,
    fecha_actualizacion: row.updated_at as string,
  }
}

function mapNotif(row: Record<string, unknown>): Notificacion {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    titulo: row.titulo as string,
    mensaje: row.mensaje as string,
    leida: row.leida as boolean,
    tipo: (row.tipo as Notificacion["tipo"]) ?? undefined,
    referencia_id: (row.referencia_id as string) ?? undefined,
    referencia_tipo: (row.referencia_tipo as Notificacion["referencia_tipo"]) ?? undefined,
    fecha_creacion: row.created_at as string,
  }
}

function mapPerfil(row: Record<string, unknown>): Perfil {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    email: row.email as string,
    rol: row.rol as Perfil["rol"],
    avatar: (row.avatar_url as string) ?? undefined,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [tickets,         setTickets]         = useState<Ticket[]>([])
  const [proyectos,       setProyectos]       = useState<Proyecto[]>([])
  const [notificaciones,  setNotificaciones]  = useState<Notificacion[]>([])
  const [perfiles,        setPerfiles]        = useState<Perfil[]>([])
  const [isLoading,       setIsLoading]       = useState(false)

  const fetchedRef  = useRef(false)
  const userIdRef   = useRef<string | null>(null)
  const readyRef    = useRef(false) // true once we have at least one successful data set

  const developers = perfiles.filter((p) => p.rol === "developer")

  // ── Auto-sync state to cache after every mutation ──────────────────────────
  // Runs whenever state changes (skipped during the initial loading phase)
  useEffect(() => {
    if (!readyRef.current || !userIdRef.current) return
    writeCache(userIdRef.current, { tickets, proyectos, notificaciones, perfiles })
  }, [tickets, proyectos, notificaciones, perfiles])

  // ── Core fetch: stale-while-revalidate ─────────────────────────────────────
  async function fetchAll(uid: string) {
    if (fetchedRef.current) return
    fetchedRef.current = true
    userIdRef.current  = uid

    // 1. Hydrate from cache immediately → no spinner on revisit
    const cached = readCache(uid)
    if (cached) {
      setTickets(cached.tickets)
      setProyectos(cached.proyectos)
      setNotificaciones(cached.notificaciones)
      setPerfiles(cached.perfiles)
      readyRef.current = true
      setIsLoading(false)

      // Cache is fresh — skip network call entirely
      if (Date.now() - cached.at < CACHE_TTL_MS) return
      // Cache is stale — revalidate silently (no loading spinner)
    } else {
      // No cache — show loading spinner while fetching
      setIsLoading(true)
    }

    // 2. Fetch fresh data from Supabase
    const supabase = createClient()
    const [ticketsRes, proyectosRes, notifsRes, perfilesRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("*, solicitante:profiles!solicitante_id(nombre), developer:profiles!developer_id(nombre)")
        .order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("nombre"),
    ])

    const newTickets        = ticketsRes.data?.map(mapTicket)        ?? []
    const newProyectos      = proyectosRes.data?.map(mapProyecto)    ?? []
    const newNotifs         = notifsRes.data?.map(mapNotif)          ?? []
    const newPerfiles       = perfilesRes.data?.map(mapPerfil)       ?? []

    setTickets(newTickets)
    setProyectos(newProyectos)
    setNotificaciones(newNotifs)
    setPerfiles(newPerfiles)
    readyRef.current = true
    setIsLoading(false)

    // 3. Persist fresh data (effect above won't double-write; this is the authoritative save)
    writeCache(uid, {
      tickets: newTickets,
      proyectos: newProyectos,
      notificaciones: newNotifs,
      perfiles: newPerfiles,
    })
  }

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchAll(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        fetchedRef.current = false
        fetchAll(session.user.id)
      }
      if (event === "SIGNED_OUT") {
        if (userIdRef.current) clearCache(userIdRef.current)
        fetchedRef.current  = false
        readyRef.current    = false
        userIdRef.current   = null
        setTickets([])
        setProyectos([])
        setNotificaciones([])
        setPerfiles([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Mutations (optimistic — cache synced by the effect above) ──────────────

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => t.id === id ? { ...t, ...updates, fecha_actualizacion: new Date().toISOString() } : t)
    )
    const supabase = createClient()
    const db: Record<string, unknown> = {}
    if (updates.estado      !== undefined) db.estado      = updates.estado
    if (updates.developer_id !== undefined) db.developer_id = updates.developer_id ?? null
    if (updates.prioridad   !== undefined) db.prioridad   = updates.prioridad
    if (updates.titulo      !== undefined) db.titulo      = updates.titulo
    if (updates.descripcion !== undefined) db.descripcion = updates.descripcion
    if (Object.keys(db).length > 0) await supabase.from("tickets").update(db).eq("id", id)
  }

  const addTicket = async (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev])
    const supabase = createClient()
    await supabase.from("tickets").insert({
      titulo:        ticket.titulo,
      descripcion:   ticket.descripcion,
      tipo:          ticket.tipo,
      estado:        ticket.estado,
      prioridad:     ticket.prioridad,
      solicitante_id: ticket.solicitante_id,
      developer_id:  ticket.developer_id  ?? null,
      proyecto_id:   ticket.proyecto_id   ?? null,
    })
  }

  const updateProyecto = async (id: string, updates: Partial<Proyecto>) => {
    setProyectos((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...updates, fecha_actualizacion: new Date().toISOString() } : p)
    )
    const supabase = createClient()
    const db: Record<string, unknown> = {}
    if (updates.estado             !== undefined) db.estado             = updates.estado
    if (updates.progreso           !== undefined) db.progreso           = updates.progreso
    if (updates.aprobacion_ti      !== undefined) db.aprobacion_ti      = updates.aprobacion_ti
    if (updates.aprobacion_negocio !== undefined) db.aprobacion_negocio = updates.aprobacion_negocio
    if (updates.nombre             !== undefined) db.nombre             = updates.nombre
    if (updates.descripcion        !== undefined) db.descripcion        = updates.descripcion
    if (updates.developer_ids      !== undefined) db.developer_ids      = updates.developer_ids
    if (Object.keys(db).length > 0) await supabase.from("projects").update(db).eq("id", id)
  }

  const addProyecto = async (proyecto: Proyecto) => {
    setProyectos((prev) => [proyecto, ...prev])
    const supabase = createClient()
    await supabase.from("projects").insert({
      nombre:             proyecto.nombre,
      descripcion:        proyecto.descripcion,
      estado:             proyecto.estado,
      progreso:           proyecto.progreso,
      aprobacion_ti:      proyecto.aprobacion_ti,
      aprobacion_negocio: proyecto.aprobacion_negocio,
      created_by:         proyecto.created_by ?? null,
    })
  }

  const markNotificacionLeida = async (id: string) => {
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
    const supabase = createClient()
    await supabase.from("notifications").update({ leida: true }).eq("id", id)
  }

  const markAllNotifsLeidas = async (userId: string) => {
    setNotificaciones((prev) => prev.map((n) => n.user_id === userId ? { ...n, leida: true } : n))
    const supabase = createClient()
    await supabase.from("notifications").update({ leida: true }).eq("user_id", userId).eq("leida", false)
  }

  const unreadCount = (userId: string) =>
    notificaciones.filter((n) => n.user_id === userId && !n.leida).length

  return (
    <DataContext.Provider value={{
      tickets, proyectos, notificaciones, perfiles, developers,
      isLoading, updateTicket, addTicket, updateProyecto, addProyecto,
      markNotificacionLeida, markAllNotifsLeidas, unreadCount,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useData must be used within a DataProvider")
  return context
}
