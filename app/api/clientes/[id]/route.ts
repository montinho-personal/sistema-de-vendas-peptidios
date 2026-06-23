import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const cliente = await prisma.cadastroCliente.update({
    where: { id },
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
  return NextResponse.json(cliente)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.cadastroCliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
