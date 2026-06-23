import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.vendaPerdida.findMany({ orderBy: { data: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const item = await prisma.vendaPerdida.create({
    data: {
      data: new Date(body.data + 'T12:00:00Z'),
      cliente: body.cliente,
      produto: body.produto,
      valor: Number(body.valor),
      quantidade: Number(body.quantidade),
      motivo: body.motivo,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
