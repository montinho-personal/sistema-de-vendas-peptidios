import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function regressaoLinear(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 }
  const xs = ys.map((_, i) => i)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0)
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0)
  const slope = den !== 0 ? num / den : 0
  return { slope, intercept: meanY - slope * meanX }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({ orderBy: { data: 'asc' } })
  const vendasPerdidas = await prisma.vendaPerdida.findMany()

  const now = new Date()

  // Agrupar por mês (YYYY-MM)
  const porMes: Record<string, number> = {}
  vendas.forEach((v) => {
    const d = new Date(v.data)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    porMes[key] = (porMes[key] || 0) + Number(v.precoVenda)
  })

  // Ordenar meses históricos
  const mesesOrdenados = Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0]))
  const historicoValues = mesesOrdenados.map(([, v]) => v)
  const n = historicoValues.length

  // Últimos 3 meses reais
  const ultimos3 = historicoValues.slice(-3)
  const media3 = ultimos3.length > 0 ? ultimos3.reduce((a, b) => a + b, 0) / ultimos3.length : 0

  // Regressão linear sobre todo histórico
  const reg = regressaoLinear(historicoValues)

  // Momentum ponderado exponencial (últimos 6 meses)
  const ultimos6 = historicoValues.slice(-6)
  let totalPeso = 0, totalValor = 0
  ultimos6.forEach((v, i) => {
    const peso = Math.pow(1.5, i)
    totalValor += v * peso
    totalPeso += peso
  })
  const momentum = totalPeso > 0 ? totalValor / totalPeso : media3

  // Crescimento para cenário otimista (só se ≥6 meses de histórico)
  let crescimento = 0.08
  if (n >= 6) {
    const prev3 = historicoValues.slice(-6, -3)
    const mediaPrev3 = prev3.reduce((a, b) => a + b, 0) / prev3.length
    if (mediaPrev3 > 0) crescimento = (media3 - mediaPrev3) / mediaPrev3
  }

  // Projeção 6 meses
  const projecao = []
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const regValue = reg.intercept + reg.slope * (n + i - 1)
    const blend = momentum * 0.6 + regValue * 0.4
    const conservador = media3 * 0.82
    const realista = blend
    const otimista = media3 * (1 + Math.max(crescimento, 0.08))
    projecao.push({
      mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      conservador: Math.max(0, Math.round(conservador)),
      realista: Math.max(0, Math.round(realista)),
      otimista: Math.max(0, Math.round(otimista)),
    })
  }

  // Previsões em dias
  const regNext = reg.intercept + reg.slope * n
  const blendNext = momentum * 0.6 + regNext * 0.4
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const prev30 = Math.max(0, Math.round(blendNext * (30 / diasMes)))
  const prev90 = Math.max(0, Math.round(blendNext * 3))
  const prev180 = Math.max(0, Math.round(blendNext * 6))
  const prev365 = Math.max(0, Math.round(blendNext * 12))

  // Histórico para gráfico (últimos 8 meses)
  const historico = mesesOrdenados.slice(-8).map(([key, val]) => {
    const [year, month] = key.split('-')
    const d = new Date(Number(year), Number(month) - 1, 1)
    return {
      mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      valor: Math.round(val),
    }
  })

  // Por produto
  const porProduto: Record<string, number[]> = {}
  mesesOrdenados.forEach(([, ], idx) => {
    const key = mesesOrdenados[idx][0]
    vendas.filter((v) => {
      const d = new Date(v.data)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key
    }).forEach((v) => {
      if (!porProduto[v.produto]) porProduto[v.produto] = Array(mesesOrdenados.length).fill(0)
      porProduto[v.produto][idx] += Number(v.precoVenda)
    })
  })

  const previsaoProdutos = Object.entries(porProduto).map(([nome, vals]) => {
    const reg2 = regressaoLinear(vals)
    const m = vals.slice(-3)
    const m3 = m.length > 0 ? m.reduce((a, b) => a + b, 0) / m.length : 0
    const mom2 = vals.slice(-6).reduce((s, v, i) => s + v * Math.pow(1.5, i), 0) /
      vals.slice(-6).reduce((s, _, i) => s + Math.pow(1.5, i), 0) || m3
    const next = mom2 * 0.6 + (reg2.intercept + reg2.slope * vals.length) * 0.4
    return {
      nome,
      prev1mes: Math.max(0, Math.round(next)),
      prev3meses: Math.max(0, Math.round(next * 3)),
      prev6meses: Math.max(0, Math.round(next * 6)),
    }
  }).sort((a, b) => b.prev1mes - a.prev1mes).slice(0, 10)

  // Impacto vendas perdidas
  const totalPerdido = vendasPerdidas.reduce((s, v) => s + Number(v.valor), 0)

  return NextResponse.json({
    historico,
    projecao,
    previsoes: { prev30, prev90, prev180, prev365 },
    previsaoProdutos,
    impactoPerdidas: { total: totalPerdido, registros: vendasPerdidas.length },
    crescimento: Math.round(crescimento * 100),
  })
}
