import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { darBaixaVenda, estornarVenda } from '@/lib/estoque'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { venda, estoque } = await prisma.$transaction(async tx => {
    const anterior = await tx.venda.findUnique({ where: { id }, select: { baixaEstoque: true } })
    // Produto ou quantidade podem ter mudado: desfaz a baixa e refaz com os dados novos.
    if (anterior?.baixaEstoque) await estornarVenda(tx, id)
    const venda = await tx.venda.update({
      where: { id },
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
        comissao: Number(body.comissao) || 0,
        lucroLiquido: Number(body.lucroLiquido),
      },
    })
    const estoque = anterior?.baixaEstoque ? await darBaixaVenda(tx, venda) : null
    return { venda, estoque }
  })
  return NextResponse.json({ ...venda, estoque })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.$transaction(async tx => {
    await estornarVenda(tx, id)
    await tx.venda.delete({ where: { id } })
  })
  return NextResponse.json({ ok: true })
}
