import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Registra um recebimento de mercadoria. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const quantidade = Math.trunc(Number(body.quantidade))
  const custoUnitario = Number(body.custoUnitario)
  if (!body.produto?.trim() || !body.dataRecebimento || !(quantidade > 0) || !(custoUnitario >= 0)) {
    return NextResponse.json({ error: 'Informe produto, data, quantidade maior que zero e custo.' }, { status: 400 })
  }
  const tipo = body.tipo === 'proprio' ? 'proprio' : 'consignado'
  if (tipo === 'consignado' && !body.fornecedor?.trim()) {
    return NextResponse.json({ error: 'Consignado precisa do fornecedor, para saber a quem você deve.' }, { status: 400 })
  }

  const lote = await prisma.loteEstoque.create({
    data: {
      produto: body.produto.trim(),
      tipo,
      fornecedor: (body.fornecedor || '').trim(),
      dataRecebimento: new Date(body.dataRecebimento + 'T12:00:00Z'),
      quantidade,
      custoUnitario,
      observacao: body.observacao || '',
    },
  })
  return NextResponse.json(lote, { status: 201 })
}
