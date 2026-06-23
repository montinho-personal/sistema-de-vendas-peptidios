import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const produto = await prisma.cadastroProduto.update({
    where: { id },
    data: {
      nome: body.nome,
      categoria: body.categoria || '',
      custoPadrao: Number(body.custoPadrao || 0),
      vendaPadrao: Number(body.vendaPadrao || 0),
      duracaoPadrao: Number(body.duracaoPadrao || 90),
      descricao: body.descricao || '',
      status: body.status || 'ativo',
    },
  })
  return NextResponse.json(produto)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.cadastroProduto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
