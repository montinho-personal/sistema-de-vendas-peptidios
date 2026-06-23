import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  await prisma.vendaPerdida.deleteMany()
  await prisma.venda.deleteMany()
  await prisma.cadastroCliente.deleteMany()
  await prisma.cadastroProduto.deleteMany()

  if (data.vendas) {
    for (const v of data.vendas) {
      await prisma.venda.create({ data: { ...v, id: undefined, createdAt: undefined } })
    }
  }
  if (data.vendasPerdidas) {
    for (const v of data.vendasPerdidas) {
      await prisma.vendaPerdida.create({ data: { ...v, id: undefined, createdAt: undefined } })
    }
  }
  if (data.clientes) {
    for (const c of data.clientes) {
      await prisma.cadastroCliente.create({ data: { ...c, id: undefined, createdAt: undefined, updatedAt: undefined } })
    }
  }
  if (data.produtos) {
    for (const p of data.produtos) {
      await prisma.cadastroProduto.create({ data: { ...p, id: undefined, createdAt: undefined, updatedAt: undefined } })
    }
  }

  return NextResponse.json({ ok: true })
}
