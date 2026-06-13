"use client"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"
import Link from "next/link"
import { GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import type { EstadoTicket, Ticket } from "@/lib/types"
import { prioridadBadge, prioridadLabel } from "@/lib/constants"

const COLUMNS: { id: EstadoTicket; label: string; color: string }[] = [
  { id: "aprobado", label: "Aprobado", color: "bg-blue-500" },
  { id: "en_progreso", label: "En Progreso", color: "bg-purple-500" },
  { id: "corregido", label: "Corregido", color: "bg-green-500" },
]

const NEXT_STATE: Partial<Record<EstadoTicket, EstadoTicket>> = {
  aprobado: "en_progreso",
  en_progreso: "corregido",
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 space-y-2 p-3 rounded-b-lg transition-colors ${isOver ? "bg-muted/60" : ""}`}
    >
      {children}
    </div>
  )
}

function KanbanCard({ ticket, overlay = false }: { ticket: Ticket; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/tickets/${ticket.id}`} onClick={(e) => isDragging && e.preventDefault()}>
        <Card className={`cursor-pointer transition-shadow hover:shadow-md ${overlay ? "shadow-lg rotate-2" : ""}`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <button
                {...attributes}
                {...listeners}
                className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded text-foreground/50 hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.preventDefault()}
                title="Arrastrar"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ticket.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {ticket.descripcion}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${prioridadBadge[ticket.prioridad]}`}>
                    {prioridadLabel[ticket.prioridad]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground capitalize">{ticket.tipo}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

export function KanbanBoard({ userId }: { userId: string }) {
  const { tickets, updateTicket } = useData()
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const myTickets = tickets.filter((t) => t.developer_id === userId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = myTickets.find((t) => t.id === event.active.id)
    setActiveTicket(ticket ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTicket(null)

    if (!over) return

    const draggedTicket = myTickets.find((t) => t.id === active.id)
    if (!draggedTicket) return

    // Resolve target column: over.id is either a column id or a ticket id
    let targetColId: EstadoTicket | undefined
    const colMatch = COLUMNS.find((c) => c.id === over.id)
    if (colMatch) {
      targetColId = colMatch.id
    } else {
      const targetTicket = myTickets.find((t) => t.id === over.id)
      if (targetTicket) targetColId = targetTicket.estado
    }

    if (!targetColId || targetColId === draggedTicket.estado) return

    // Only allow transitions defined in NEXT_STATE (prevents skipping states)
    if (NEXT_STATE[draggedTicket.estado] !== targetColId) return

    updateTicket(active.id as string, { estado: targetColId })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTickets = myTickets.filter((t) => t.estado === col.id)
          return (
            <div key={col.id} className="rounded-lg border bg-card">
              <div className="border-b p-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${col.color}`} />
                  <h3 className="font-medium text-sm">{col.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {colTickets.length}
                  </Badge>
                </div>
              </div>
              <SortableContext
                items={colTickets.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn id={col.id}>
                  {colTickets.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Sin tickets
                    </p>
                  ) : (
                    colTickets.map((ticket) => (
                      <KanbanCard key={ticket.id} ticket={ticket} />
                    ))
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeTicket && <KanbanCard ticket={activeTicket} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
