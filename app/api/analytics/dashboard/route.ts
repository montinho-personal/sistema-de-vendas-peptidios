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

  if (periodo === '7d') { from = new Date(now); from.setDate(now.getDate() - 7) }
  else if (periodo === '15d') { from = new Date(now); from.setDate(now.getDate() - 15) }
  else if (periodo === 'trimestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) }
  else if (periodo === 'semestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1) }
  else if (periodo === 'ano') { from = new Date(now.getFullYear(), 0, 1) }
  else if (periodo === 'historico') { from = new Date('2000-01-01') }
  else { from = new Date(now.getFullYear(), now.getMonth(), 1) } // mes

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1)

  const [vendasPeriodo, vendasHoje, todas] = await Promise.all([
    prisma.venda.findMany({ where: { data: { gte: from } } }),
    prisma.venda.findMany({ where: { data: { gte: todayStart, lt: todayEnd } } }),
    prisma.venda.findMany({ orderBy: { data: 'asc' } }),
  ])

  const faturamento = vendasPeriodo.reduce((s, v) => s + Number(v.precoVenda), 0)
  const lucroBruto = vendasPeriodo.reduce((s, v) => s + Number(v.lucroBruto), 0)
  const lucroLiquido = vendasPeriodo.reduce((s, v) => s + Number(v.lucroLiquido), 0)
  const pedidos = vendasPeriodo.length
  const ticketMedio = pedidos > 0 ? faturamento / pedidos : 0
  const margem = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0
  const vendasHojeTotal = vendasHoje.reduce((s, v) => s + Number(v.precoVenda), 0)

  // Gráfico últimos 8 meses
  const meses: { mes: string; faturamento: number; lucro: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const vs = todas.filter((v) => v.data >= d && v.data < fim)
    meses.push({
      mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      faturamento: vs.reduce((s, v) => s + Number(v.precoVenda), 0),
      lucro: vs.reduce((s, v) => s + Number(v.lucroLiquido), 0),
    })
  }

  // Top 5 produtos
  const porProduto: Record<string, number> = {}
  vendasPeriodo.forEach((v) => {
    porProduto[v.produto] = (porProduto[v.produto] || 0) + Number(v.precoVenda)
  })
  const topProdutos = Object.entries(porProduto)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }))

  // Top 5 clientes
  const porCliente: Record<string, number> = {}
  vendasPeriodo.forEach((v) => {
    porCliente[v.cliente] = (porCliente[v.cliente] || 0) + Number(v.precoVenda)
  })
  const topClientes = Object.entries(porCliente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }))

  return NextResponse.json({
    kpis: { vendasHoje: vendasHojeTotal, faturamento, lucroBruto, lucroLiquido, pedidos, ticketMedio, margem },
    grafico: meses,
    topProdutos,
    topClientes,
  })
}
