import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Corrige um recebimento. A quantidade não pode ficar abaixo do que já saiu do lote. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const quantidade = Math.trunc(Number(body.quantidade))
  const custoUnitario = Number(body.custoUnitario)
  if (!(quantidade > 0) || !(custoUnitario >= 0) || !body.dataRecebimento) {
    return NextResponse.json({ error: 'Quantidade, custo e data são obrigatórios.' }, { status: 400 })
  }

  const saido = await prisma.movimentoEstoque.aggregate({ where: { loteId: id }, _sum: { quantidade: true } })
  const jaSaiu = saido._sum.quantidade ?? 0
  if (quantidade < jaSaiu) {
    return NextResponse.json({ error: `Já saíram ${jaSaiu} unidades deste lote; a quantidade recebida não pode ser menor.` }, { status: 400 })
  }

  const tipo = body.tipo === 'proprio' ? 'proprio' : 'consignado'
  const lote = await prisma.loteEstoque.update({
    where: { id },
    data: {
      tipo,
      fornecedor: (body.fornecedor || '').trim(),
      dataRecebimento: new Date(body.dataRecebimento + 'T12:00:00Z'),
      quantidade,
      custoUnitario,
      observacao: body.observacao || '',
    },
  })
  return NextResponse.json(lote)
}

/** Só apaga lote sem nenhuma saída — senão vendas e devoluções perderiam a origem. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const saidas = await prisma.movimentoEstoque.count({ where: { loteId: id } })
  if (saidas > 0) {
    return NextResponse.json({ error: 'Este lote já tem saídas registradas. Corrija a quantidade em vez de excluir.' }, { status: 400 })
  }
  await prisma.loteEstoque.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
