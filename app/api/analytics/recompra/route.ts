import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({ orderBy: { data: 'desc' } })
  const clientes = await prisma.cadastroCliente.findMany()
  const phoneMap: Record<string, string> = {}
  type Cliente = typeof clientes[0]
  clientes.forEach((c: Cliente) => { phoneMap[c.nome] = c.telefone })

  const today = new Date()
  const grouped: Record<string, { data: Date; proximaCompra: Date; precoVenda: number; diasDuracao: number }[]> = {}

  for (const v of vendas) {
    const key = `${v.cliente}||${v.produto}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push({ data: v.data, proximaCompra: v.proximaCompra, precoVenda: Number(v.precoVenda), diasDuracao: v.diasDuracao })
  }

  const items = []
  for (const [key, compras] of Object.entries(grouped)) {
    const [cliente, produto] = key.split('||')
    const sorted = compras.sort((a, b) => b.data.getTime() - a.data.getTime())
    const ultima = sorted[0]

    let cicloMedio = ultima.diasDuracao || 90
    if (sorted.length >= 2) {
      const diffs = []
      for (let i = 0; i < sorted.length - 1; i++) {
        diffs.push(Math.round((sorted[i].data.getTime() - sorted[i+1].data.getTime()) / 86400000))
      }
      cicloMedio = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
    }

    const diasRestantes = Math.floor((ultima.proximaCompra.getTime() - today.getTime()) / 86400000)
    const diasSemComprar = Math.floor((today.getTime() - ultima.data.getTime()) / 86400000)

    let status = 'proximo'
    if (diasRestantes < 0) status = 'atrasado'
    else if (diasRestantes === 0) status = 'hoje'
    else if (diasRestantes <= 7) status = 'esta_semana'

    const probabilidade = diasRestantes < 0 ? Math.max(20, 60 - Math.abs(diasRestantes) * 2) : diasRestantes <= 7 ? 75 : diasRestantes <= 14 ? 60 : 45

    items.push({
      cliente, produto,
      telefone: phoneMap[cliente] || '',
      ultimaCompra: ultima.data.toISOString().split('T')[0],
      proximaCompra: ultima.proximaCompra.toISOString().split('T')[0],
      diasRestantes,
      cicloMedio,
      probabilidade,
      valorEstimado: ultima.precoVenda,
      status,
    })
  }

  items.sort((a, b) => a.diasRestantes - b.diasRestantes)

  return NextResponse.json({ items })
}
