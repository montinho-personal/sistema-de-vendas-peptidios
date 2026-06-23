import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const produtos = await prisma.cadastroProduto.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(produtos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const produto = await prisma.cadastroProduto.create({
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
  return NextResponse.json(produto, { status: 201 })
}
