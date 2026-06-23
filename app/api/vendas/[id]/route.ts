import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const venda = await prisma.venda.update({
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
      lucroLiquido: Number(body.lucroLiquido),
    },
  })
  return NextResponse.json(venda)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.venda.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
