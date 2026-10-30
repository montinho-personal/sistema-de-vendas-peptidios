import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Desfaz uma devolução ou perda. Baixas de venda só mudam editando ou excluindo a venda. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const mov = await prisma.movimentoEstoque.findUnique({ where: { id } })
  if (!mov) return NextResponse.json({ error: 'Movimentação não encontrada.' }, { status: 404 })
  if (mov.tipo === 'venda') {
    return NextResponse.json({ error: 'Baixa de venda: edite ou exclua a venda em Todas as Vendas.' }, { status: 400 })
  }
  await prisma.movimentoEstoque.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
