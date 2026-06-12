"use client"

import { useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Sparkles, Copy, Download, FileText, TrendingUp, Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const REPORT_PRESETS = [
  {
    id: "tickets",
    icon: FileText,
    title: "Resumen de Tickets",
    description: "Estado actual de todos los tickets abiertos y su distribución",
    buildPrompt: () =>
      "Genera un reporte ejecutivo sobre el estado actual de tickets. Analiza la distribución por estado (en revisión, aprobados, en progreso), prioridad y tipo. Identifica cuellos de botella e indica qué tickets requieren atención inmediata.",
  },
  {
    id: "developers",
    icon: Users,
    title: "Performance por Developer",
    description: "Análisis de carga de trabajo y eficiencia del equipo de desarrollo",
    buildPrompt: () =>
      "Analiza la carga de trabajo del equipo de desarrollo. Para cada developer, muestra cuántos tickets activos tiene asignados, qué tipos predominan y cómo está distribuida la carga. Recomienda cómo optimizar la asignación.",
  },
  {
    id: "proyectos",
    icon: TrendingUp,
    title: "Estado de Proyectos",
    description: "Evaluación del portafolio de proyectos y sus aprobaciones",
    buildPrompt: () =>
      "Genera un reporte ejecutivo del portafolio de proyectos. Para cada proyecto indica su progreso actual, estado de aprobaciones (TI y Negocio) y tickets asociados activos. Recomienda prioridades y acciones para avanzar los proyectos bloqueados.",
  },
]

export default function ReportesIAPage() {
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState("")
  const [modelUsed, setModelUsed] = useState("")
  const [loading, setLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const markdownRef = useRef<HTMLDivElement>(null)

  const handlePreset = (preset: typeof REPORT_PRESETS[0]) => {
    setActivePreset(preset.id)
    setPrompt(preset.buildPrompt())
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult("")
    setModelUsed("")

    try {
      const res = await fetch("/api/reportes/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) throw new Error("Error al generar reporte")

      const data = await res.json()
      setResult(data.content ?? "Sin respuesta del servidor.")
      if (data.model) setModelUsed(data.model)
    } catch {
      setResult("⚠️ Error al conectar con OpenRouter. Verifica que `OPENROUTER_API_KEY` esté configurada en `.env.local`.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMD = () => {
    const presetTitle = REPORT_PRESETS.find((p) => p.id === activePreset)?.title ?? "Reporte"
    const date = new Date().toISOString().split("T")[0]
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${presetTitle.replace(/\s+/g, "_")}_${date}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = () => {
    const presetTitle = REPORT_PRESETS.find((p) => p.id === activePreset)?.title ?? "Reporte IA"
    const date = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    const content = markdownRef.current?.innerHTML ?? ""

    const win = window.open("", "_blank")
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${presetTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, "Times New Roman", serif; max-width: 780px; margin: 48px auto; padding: 0 32px; color: #111; line-height: 1.7; font-size: 15px; }
    .cover { margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #111; }
    .cover h1 { font-size: 1.7em; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
    .cover .meta { font-family: Arial, sans-serif; font-size: 0.82em; color: #555; }
    h1 { font-size: 1.5em; margin: 28px 0 10px; font-weight: 700; }
    h2 { font-size: 1.25em; margin: 24px 0 8px; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 1.05em; margin: 18px 0 6px; font-weight: 700; }
    p  { margin: 10px 0; }
    ul, ol { padding-left: 22px; margin: 10px 0; }
    li { margin: 4px 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: "Courier New", monospace; font-size: 0.88em; }
    pre { background: #f4f4f4; padding: 14px; border-radius: 4px; margin: 12px 0; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #aaa; padding-left: 14px; color: #444; margin: 12px 0; }
    table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 0.9em; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; font-weight: 700; font-family: Arial, sans-serif; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    @media print {
      body { margin: 0; padding: 24px 32px; }
      .cover { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${presetTitle}</h1>
    <div class="meta">HuntersTrack AI &nbsp;·&nbsp; ${date}</div>
  </div>
  ${content}
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes IA</h1>
        <p className="text-muted-foreground">Genera análisis ejecutivos con inteligencia artificial</p>
      </div>

      {/* Presets */}
      <div className="grid gap-3 sm:grid-cols-3">
        {REPORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePreset(preset)}
            className={`rounded-lg border p-4 text-left transition-all ${
              activePreset === preset.id
                ? "border-primary bg-primary/10 ring-1 ring-primary/20 shadow-sm"
                : "hover:bg-muted/50 hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <preset.icon className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{preset.title}</span>
              {activePreset === preset.id && (
                <Badge className="ml-auto text-[10px]">Activo</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{preset.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt personalizado</CardTitle>
            <CardDescription>Edita o escribe tu propia consulta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={8}
              placeholder="Selecciona un tipo de reporte arriba o escribe tu consulta aquí..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                llama-3.3-70b · OpenRouter
              </div>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} size="lg" className="w-full gap-2">
                <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Generando..." : "Generar con IA"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Resultado</CardTitle>
              <CardDescription>
                {modelUsed ? `Generado con ${modelUsed}` : "Análisis generado por IA"}
              </CardDescription>
            </div>
            {result && (
              <div className="flex gap-1 flex-wrap justify-end">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-8 px-2">
                  {copied
                    ? <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-xs">Copiado</span></>
                    : <><Copy className="h-3.5 w-3.5" /><span className="text-xs">Copiar</span></>
                  }
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownloadMD} className="gap-1 h-8 px-2">
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-xs">.md</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownloadPDF} className="gap-1 h-8 px-2">
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-xs">PDF</span>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {loading && (
              <div className="space-y-2 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`h-3 rounded bg-muted ${i % 3 === 2 ? "w-1/2" : i % 4 === 3 ? "w-3/4" : "w-full"}`} />
                ))}
              </div>
            )}
            {!loading && !result && (
              <div className="flex flex-col items-center justify-center h-52 text-center gap-3 px-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-5 w-5 text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">¿Qué quieres analizar?</p>
                  <p className="text-xs text-muted-foreground">
                    Selecciona un tipo de reporte arriba o escribe tu propia consulta
                  </p>
                  <p className="text-xs text-muted-foreground/50 italic mt-2">
                    Ej: &quot;¿Qué developer tiene más carga esta semana?&quot;
                  </p>
                </div>
              </div>
            )}
            {!loading && result && (
              <>
                <Separator className="mb-4" />
                <div ref={markdownRef} className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                  prose-p:leading-relaxed prose-p:text-foreground
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:my-2 prose-li:my-0.5
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
