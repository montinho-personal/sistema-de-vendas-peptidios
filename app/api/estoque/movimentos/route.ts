import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lotesComSaldo } from '@/lib/estoque'

/** Devolução ao fornecedor ou perda. Vendas dão baixa sozinhas, pela tela de vendas. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const quantidade = Math.trunc(Number(body.quantidade))
  const tipo = body.tipo === 'perda' ? 'perda' : 'devolucao'
  if (!body.loteId || !(quantidade > 0) || !body.data) {
    return NextResponse.json({ error: 'Informe o lote, a data e uma quantidade maior que zero.' }, { status: 400 })
  }

  try {
    const mov = await prisma.$transaction(async tx => {
      const lote = (await lotesComSaldo(tx)).find(l => l.id === body.loteId)
      if (!lote) throw new Error('Lote não encontrado.')
      if (quantidade > lote.saldo) throw new Error(`Este lote só tem ${lote.saldo} em estoque.`)
      return tx.movimentoEstoque.create({
        data: { loteId: lote.id, tipo, quantidade, data: new Date(body.data + 'T12:00:00Z'), observacao: body.observacao || '' },
      })
    })
    return NextResponse.json(mov, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
