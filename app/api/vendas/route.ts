import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get('periodo') || 'historico'
    const busca = searchParams.get('busca') || ''
    const orderBy = searchParams.get('orderBy') || 'data'
    const order = searchParams.get('order') || 'desc'

    const now = new Date()
    let from: Date | undefined

    if (periodo === '7d') { from = new Date(now); from.setDate(now.getDate() - 7) }
    else if (periodo === '15d') { from = new Date(now); from.setDate(now.getDate() - 15) }
    else if (periodo === 'mes') { from = new Date(now.getFullYear(), now.getMonth(), 1) }
    else if (periodo === 'trimestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) }
    else if (periodo === 'semestre') { from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1) }
    else if (periodo === 'ano') { from = new Date(now.getFullYear(), 0, 1) }

    const allowedFields = ['data', 'cliente', 'produto', 'quantidade', 'precoVenda', 'precoCusto', 'lucroBruto', 'taxa', 'lucroLiquido', 'formaPagamento', 'proximaCompra']
    const sortField = allowedFields.includes(orderBy) ? orderBy : 'data'

    const where: Record<string, unknown> = {}
    if (from) where.data = { gte: from }
    if (busca) {
      where.OR = [
        { cliente: { contains: busca, mode: 'insensitive' } },
        { produto: { contains: busca, mode: 'insensitive' } },
      ]
    }

    const vendas = await prisma.venda.findMany({
      where,
      orderBy: { [sortField]: order as 'asc' | 'desc' },
    })

    return NextResponse.json(vendas)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const venda = await prisma.venda.create({
    data: {
      data: new Date(body.data + 'T12:00:00Z'),
      mes: body.mes,
      ano: Number(body.ano),
      cliente: body.cliente,
      produto: body.produto,
      quantidade: Number(body.quantidade),
      precoCusto: Number(body.precoCusto),
      precoVenda: Number(body.precoVenda),
      lucroBruto: Number(body.lucroBruto),
      diasDuracao: Number(body.diasDuracao),
      proximaCompra: new Date(body.proximaCompra + 'T12:00:00Z'),
      formaPagamento: body.formaPagamento,
      taxa: Number(body.taxa),
      lucroLiquido: Number(body.lucroLiquido),
    },
  })
  return NextResponse.json(venda, { status: 201 })
}
