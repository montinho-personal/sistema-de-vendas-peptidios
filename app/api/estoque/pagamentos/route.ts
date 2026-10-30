import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Registra um repasse a fornecedor de consignado. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const valor = Number(body.valor)
  if (!body.fornecedor?.trim() || !body.data || !(valor > 0)) {
    return NextResponse.json({ error: 'Informe fornecedor, data e um valor maior que zero.' }, { status: 400 })
  }
  const pg = await prisma.pagamentoFornecedor.create({
    data: { fornecedor: body.fornecedor.trim(), data: new Date(body.data + 'T12:00:00Z'), valor, observacao: body.observacao || '' },
  })
  return NextResponse.json(pg, { status: 201 })
}
