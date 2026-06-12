import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-31b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
]

// ─── Fetch real data from Supabase ───────────────────────────────────────────

async function buildContext(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return ""

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const [ticketsRes, projectsRes, profilesRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, titulo, tipo, estado, prioridad, created_at, solicitante:profiles!solicitante_id(nombre), developer:profiles!developer_id(nombre)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("projects")
        .select("nombre, estado, progreso, aprobacion_ti, aprobacion_negocio")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("nombre, rol")
        .order("nombre"),
    ])

    const tickets = ticketsRes.data ?? []
    const projects = projectsRes.data ?? []
    const profiles = profilesRes.data ?? []

    const estadoCount = (e: string) => tickets.filter((t) => t.estado === e).length
    const prioridadLabel = (p: number) => p === 1 ? "Alta" : p === 2 ? "Media" : "Baja"
    const developers = profiles.filter((p) => p.rol === "developer")

    const ticketLines = tickets
      .filter((t) => t.estado !== "cerrado" && t.estado !== "corregido")
      .slice(0, 30)
      .map((t) => {
        const dev = (t.developer as { nombre: string } | null)?.nombre ?? "Sin asignar"
        const sol = (t.solicitante as { nombre: string } | null)?.nombre ?? "—"
        const fecha = new Date(t.created_at).toLocaleDateString("es-ES")
        return `  - [${t.tipo}] "${t.titulo}" | ${t.estado} | prioridad ${prioridadLabel(t.prioridad)} | developer: ${dev} | solicitante: ${sol} | creado: ${fecha}`
      })

    const projectLines = projects.map((p) => {
      const ti = p.aprobacion_ti ? "✓" : "✗"
      const neg = p.aprobacion_negocio ? "✓" : "✗"
      return `  - "${p.nombre}" | ${p.estado} | ${p.progreso}% progreso | aprobación TI: ${ti} | aprobación Negocio: ${neg}`
    })

    const devWorkload = developers.map((d) => {
      const activos = tickets.filter(
        (t) => (t.developer as { nombre: string } | null)?.nombre === d.nombre &&
               (t.estado === "en_progreso" || t.estado === "aprobado")
      ).length
      return `  - ${d.nombre}: ${activos} tickets activos`
    })

    return `
=== DATOS REALES DEL SISTEMA (HuntersTrack AI) ===

RESUMEN DE TICKETS:
  - Total: ${tickets.length}
  - En revisión: ${estadoCount("en_revision")}
  - Aprobados: ${estadoCount("aprobado")}
  - En progreso: ${estadoCount("en_progreso")}
  - Corregidos: ${estadoCount("corregido")}
  - Cerrados: ${estadoCount("cerrado")}

TICKETS ACTIVOS (${ticketLines.length}):
${ticketLines.join("\n") || "  (ninguno)"}

PROYECTOS (${projects.length} total):
${projectLines.join("\n") || "  (ninguno)"}

EQUIPO DE DESARROLLO (${developers.length} developers):
${devWorkload.join("\n") || "  (ninguno)"}

TODOS LOS USUARIOS (${profiles.length}):
${profiles.map((p) => `  - ${p.nombre} [${p.rol}]`).join("\n")}
=== FIN DE DATOS ===
`.trim()
  } catch {
    return ""
  }
}

// ─── Call OpenRouter model ────────────────────────────────────────────────────

async function callModel(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      "X-Title": "HuntersTrack AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1536,
    }),
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: "Prompt requerido" }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      content:
        "⚠️ OPENROUTER_API_KEY no configurada.\n\n" +
        "Agrega en .env.local:\n  OPENROUTER_API_KEY=sk-or-...",
    }, { status: 200 })
  }

  // Fetch real data from Supabase to give the AI actual context
  const dbContext = await buildContext()

  const systemPrompt = [
    "Eres un asistente experto en gestión de proyectos IT para la empresa HuntersTrack.",
    "Genera reportes ejecutivos en español: concisos, con secciones claras, bullets y recomendaciones accionables.",
    "Usa los datos reales del sistema que se te proporcionan. NO inventes ni supongas datos.",
    "Si los datos son escasos, analiza lo que hay y recomienda cómo mejorar la recolección de datos.",
    dbContext ? `\n${dbContext}` : "",
  ].filter(Boolean).join("\n")

  let lastError = ""

  for (const model of FREE_MODELS) {
    try {
      const response = await callModel(apiKey, model, systemPrompt, prompt)

      if (response.status === 429) {
        await response.text()
        continue
      }

      if (!response.ok) {
        lastError = await response.text()
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content ?? "Sin respuesta del modelo."
      const usedModel = (data.model ?? model).replace(":free", "")
      return NextResponse.json({ content, model: usedModel })
    } catch (error) {
      lastError = String(error)
    }
  }

  return NextResponse.json({
    content:
      "⚠️ Todos los modelos gratuitos de OpenRouter están ocupados en este momento.\n\n" +
      "Intenta de nuevo en unos minutos.",
  }, { status: 200 })
}
