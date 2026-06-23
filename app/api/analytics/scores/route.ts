import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [vendas, clientes] = await Promise.all([
    prisma.venda.findMany(),
    prisma.cadastroCliente.findMany(),
  ])

  const now = new Date()

  // Agrupar vendas por cliente
  type Venda = typeof vendas[0]
  type Cliente = typeof clientes[0]
  const porCliente: Record<string, typeof vendas> = {}
  vendas.forEach((v: Venda) => {
    if (!porCliente[v.cliente]) porCliente[v.cliente] = []
    porCliente[v.cliente].push(v)
  })

  // Calcular totais por cliente para normalização
  const totaisFaturamento: Record<string, number> = {}
  const totalPedidos: Record<string, number> = {}
  Object.entries(porCliente).forEach(([nome, vs]) => {
    totaisFaturamento[nome] = vs.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
    totalPedidos[nome] = vs.length
  })

  const maxTotal = Math.max(...Object.values(totaisFaturamento), 1)
  const maxPedidos = Math.max(...Object.values(totalPedidos), 1)

  // Indicações diretas por cliente
  const indicacoesDiretas: Record<string, number> = {}
  clientes.forEach((c: Cliente) => {
    if (c.indicadoPor) {
      indicacoesDiretas[c.indicadoPor] = (indicacoesDiretas[c.indicadoPor] || 0) + 1
    }
  })
  const maxDiretas = Math.max(...Object.values(indicacoesDiretas), 1)

  // Valor de cadeia multinível
  const clienteMap = Object.fromEntries(clientes.map((c: Cliente) => [c.nome, c]))
  function getValorCadeia(nome: string, visited: Set<string> = new Set(), depth = 0): number {
    if (depth >= 6 || visited.has(nome)) return 0
    visited.add(nome)
    const filhos = clientes.filter((c: Cliente) => c.indicadoPor === nome)
    let total = 0
    const decay = Math.pow(0.5, depth)
    for (const filho of filhos) {
      total += (totaisFaturamento[filho.nome] || 0) * decay
      total += getValorCadeia(filho.nome, visited, depth + 1)
    }
    return total
  }

  const valoresCadeia: Record<string, number> = {}
  Object.keys(porCliente).forEach((nome) => {
    valoresCadeia[nome] = getValorCadeia(nome)
  })
  const maxValorCadeia = Math.max(...Object.values(valoresCadeia), 1)

  const scores = clientes.map((c: Cliente) => {
    const vs = porCliente[c.nome] || []
    const totalGasto = totaisFaturamento[c.nome] || 0
    const pedidosCount = totalPedidos[c.nome] || 0
    const ticketMedio = pedidosCount > 0 ? totalGasto / pedidosCount : 0

    // Ciclo médio histórico (média de diasDuracao)
    const cicloMedio = vs.length > 0
      ? vs.reduce((s: number, v: Venda) => s + v.diasDuracao, 0) / vs.length
      : 90

    // Dias sem comprar
    const ultimaCompra = vs.length > 0
      ? new Date(Math.max(...vs.map((v: Venda) => new Date(v.data).getTime())))
      : null
    const diasSemComprar = ultimaCompra
      ? Math.floor((now.getTime() - ultimaCompra.getTime()) / 86400000)
      : 9999

    // Probabilidade recompra
    const ratio = diasSemComprar / cicloMedio
    let prob = ratio < 0.7 ? 0.92 : ratio < 1.0 ? 0.75 : ratio < 1.3 ? 0.55 : ratio < 1.8 ? 0.32 : 0.12
    if (pedidosCount >= 10) prob = Math.min(prob + 0.05, 0.99)
    else if (pedidosCount >= 5) prob = Math.min(prob + 0.10, 0.99)

    // Longevidade
    const datas = vs.map((v: Venda) => new Date(v.data).getTime())
    const diasEntreFirstLast = datas.length >= 2
      ? (Math.max(...datas) - Math.min(...datas)) / 86400000
      : 0

    // Score
    const ptTotal = (totalGasto / maxTotal) * 30
    const ptFreq = (pedidosCount / maxPedidos) * 18
    const ptTicket = Math.min(ticketMedio / 3000, 1) * 12
    const ptRecompra = prob * 17
    const ptLongevidade = Math.min(diasEntreFirstLast / 180, 1) * 8
    const ptIndicDiretas = Math.min((indicacoesDiretas[c.nome] || 0) / maxDiretas, 1) * 8
    const ptCadeia = Math.min((valoresCadeia[c.nome] || 0) / maxValorCadeia, 1) * 7

    const score = Math.round(ptTotal + ptFreq + ptTicket + ptRecompra + ptLongevidade + ptIndicDiretas + ptCadeia)
    const categoria = score >= 70 ? 'Premium' : score >= 45 ? 'Regular' : 'Em Risco'

    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      score,
      categoria,
      totalGasto,
      pedidos: pedidosCount,
      ticketMedio,
      probabilidadeRecompra: Math.round(prob * 100),
      cicloMedio: Math.round(cicloMedio),
      diasSemComprar,
      ultimaCompra: ultimaCompra?.toISOString() || null,
      indicacoesDiretas: indicacoesDiretas[c.nome] || 0,
      valorCadeia: Math.round(valoresCadeia[c.nome] || 0),
      indicadoPor: c.indicadoPor,
    }
  })

  scores.sort((a: { score: number }, b: { score: number }) => b.score - a.score)
  return NextResponse.json(scores)
}
