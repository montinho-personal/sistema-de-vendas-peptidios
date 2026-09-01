import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'mes'

  const now = new Date()
  let from: Date
  // `to` fecha o período por cima. Só os filtros de mês específico usam,
  // os demais seguem abertos até a venda mais recente.
  let to: Date | undefined

  const mesEspecifico = /^(\d{4})-(\d{2})$/.exec(periodo)

  if (mesEspecifico) {
    const ano = Number(mesEspecifico[1])
    const mes = Number(mesEspecifico[2]) - 1
    from = new Date(Date.UTC(ano, mes, 1))
    to = new Date(Date.UTC(ano, mes + 1, 1))
  }
  else if (periodo === 'mes-passado') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  }
  else if (periodo === '7d') { from = new Date(now); from.setDate(now.getDate() - 7) }
  else if (periodo === '15d') { from = new Date(now); from.setDate(now.getDate() - 15) }
  else if (periodo === 'trimestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) }
  else if (periodo === 'semestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1) }
  else if (periodo === 'ano') { from = new Date(now.getFullYear(), 0, 1) }
  else if (periodo === 'historico') { from = new Date('2000-01-01') }
  else { from = new Date(now.getFullYear(), now.getMonth(), 1) } // mes

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1)

  const [vendasPeriodo, vendasHoje, todas] = await Promise.all([
    prisma.venda.findMany({ where: { data: to ? { gte: from, lt: to } : { gte: from } } }),
    prisma.venda.findMany({ where: { data: { gte: todayStart, lt: todayEnd } } }),
    prisma.venda.findMany({ orderBy: { data: 'asc' } }),
  ])

  type Venda = typeof vendasPeriodo[0]
  const faturamento = vendasPeriodo.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
  const lucroBruto = vendasPeriodo.reduce((s: number, v: Venda) => s + Number(v.lucroBruto), 0)
  const lucroLiquido = vendasPeriodo.reduce((s: number, v: Venda) => s + Number(v.lucroLiquido), 0)
  const pedidos = vendasPeriodo.length
  const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0
  const margem = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0
  const vendasHojeTotal = vendasHoje.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)

  // Gráfico dos 8 meses terminando no mês filtrado (ou no mês atual)
  const ancora = to
    ? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 1, 1))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const meses: { mes: string; faturamento: number; lucro: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(Date.UTC(ancora.getUTCFullYear(), ancora.getUTCMonth() - i, 1))
    const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    const vs = todas.filter((v: Venda) => v.data >= d && v.data < fim)
    meses.push({
      mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      faturamento: vs.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0),
      lucro: vs.reduce((s: number, v: Venda) => s + Number(v.lucroLiquido), 0),
    })
  }

  // Meses que têm vendas, para alimentar o seletor (mais recente primeiro)
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const chavesMeses = new Set<string>()
  todas.forEach((v: Venda) => {
    chavesMeses.add(`${v.data.getUTCFullYear()}-${String(v.data.getUTCMonth() + 1).padStart(2, '0')}`)
  })
  const mesesDisponiveis = [...chavesMeses].sort().reverse().map(value => {
    const [ano, mes] = value.split('-')
    return { value, label: `${MESES[Number(mes) - 1]}/${ano}` }
  })

  // Top 5 produtos
  const porProduto: Record<string, number> = {}
  vendasPeriodo.forEach((v: Venda) => {
    porProduto[v.produto] = (porProduto[v.produto] || 0) + Number(v.precoVenda)
  })
  const topProdutos = Object.entries(porProduto)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }))

  // Top 5 clientes
  const porCliente: Record<string, number> = {}
  vendasPeriodo.forEach((v: Venda) => {
    porCliente[v.cliente] = (porCliente[v.cliente] || 0) + Number(v.precoVenda)
  })
  const topClientes = Object.entries(porCliente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }))

  return NextResponse.json({
    kpis: { vendasHoje: vendasHojeTotal, faturamento, lucroBruto, lucroLiquido, pedidos, ticketMedio, margem },
    grafico: meses,
    mesesDisponiveis,
    topProdutos,
    topClientes,
  })
}
