import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientes = await prisma.cadastroCliente.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const cliente = await prisma.cadastroCliente.create({
    data: {
      nome: body.nome,
      telefone: body.telefone || '',
      email: body.email || '',
      cidade: body.cidade || '',
      aniversario: body.aniversario ? new Date(body.aniversario + 'T12:00:00Z') : null,
      indicadoPor: body.indicadoPor || '',
      observacoes: body.observacoes || '',
      status: body.status || 'ativo',
    },
  })
  return NextResponse.json(cliente, { status: 201 })
}
