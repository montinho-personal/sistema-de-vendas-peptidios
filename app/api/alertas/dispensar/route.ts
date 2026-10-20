import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Marca um alerta de recompra como tratado — por contato feito ou descarte. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { cliente, produto, ultimaCompra, motivo } = await req.json()
    if (!cliente || !produto || !ultimaCompra) {
      return NextResponse.json({ error: 'cliente, produto e ultimaCompra são obrigatórios' }, { status: 400 })
    }

    const chave = {
      cliente,
      produto,
      ultimaCompra: new Date(ultimaCompra + 'T12:00:00Z'),
    }
    const dispensado = await prisma.alertaDispensado.upsert({
      where: { cliente_produto_ultimaCompra: chave },
      update: { motivo: motivo === 'descartado' ? 'descartado' : 'contato' },
      create: { ...chave, motivo: motivo === 'descartado' ? 'descartado' : 'contato' },
    })
    return NextResponse.json(dispensado, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

/** Devolve o alerta à lista. */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { cliente, produto, ultimaCompra } = await req.json()
    if (!cliente || !produto || !ultimaCompra) {
      return NextResponse.json({ error: 'cliente, produto e ultimaCompra são obrigatórios' }, { status: 400 })
    }

    await prisma.alertaDispensado.deleteMany({
      where: { cliente, produto, ultimaCompra: new Date(ultimaCompra + 'T12:00:00Z') },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
