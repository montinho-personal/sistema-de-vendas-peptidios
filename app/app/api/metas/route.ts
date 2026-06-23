import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const metas = await prisma.meta.findMany({ orderBy: { createdAt: 'desc' } })
  const vendas = await prisma.venda.findMany()

  const result = metas.map(m => {
    let valorAtual = 0
    const [ano, rest] = m.periodo.split('-')
    const anoN = Number(ano)

    const filtradas = vendas.filter(v => {
      if (v.data.getFullYear() !== anoN) return false
      if (!rest) return true // anual
      if (rest.startsWith('T')) {
        const tri = Number(rest.slice(1))
        const mesV = v.data.getMonth() + 1
        return Math.ceil(mesV / 3) === tri
      }
      // mensal: rest = "MM"
      return String(v.data.getMonth() + 1).padStart(2, '0') === rest
    })

    if (m.tipo === 'faturamento') valorAtual = filtradas.reduce((s, v) => s + Number(v.precoVenda), 0)
    else if (m.tipo === 'lucro') valorAtual = filtradas.reduce((s, v) => s + Number(v.lucroLiquido), 0)
    else if (m.tipo === 'pedidos') valorAtual = filtradas.length
    else if (m.tipo === 'clientes') {
      const unique = new Set(filtradas.map(v => v.cliente))
      valorAtual = unique.size
    }

    return { id: m.id, tipo: m.tipo, periodo: m.periodo, valorMeta: Number(m.valorMeta), valorAtual, descricao: m.descricao }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const meta = await prisma.meta.create({
    data: { tipo: body.tipo, periodo: body.periodo, valorMeta: Number(body.valorMeta), descricao: body.descricao || '' }
  })
  return NextResponse.json(meta, { status: 201 })
}
