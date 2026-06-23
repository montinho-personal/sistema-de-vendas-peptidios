import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({ orderBy: { data: 'desc' } })
  const today = new Date()

  // Per-client, per-product last purchase + cycle
  const map: Record<string, Record<string, { ultimaCompra: Date; proximaCompra: Date; cicloMedio: number; valorEstimado: number; telefone: string }>> = {}

  // Get client phones
  const clientes = await prisma.cadastroCliente.findMany()
  const phoneMap: Record<string, string> = {}
  clientes.forEach(c => { phoneMap[c.nome] = c.telefone })

  // Group by cliente+produto
  const grouped: Record<string, { compras: { data: Date; proximaCompra: Date; precoVenda: number }[] }> = {}
  for (const v of vendas) {
    const key = `${v.cliente}||${v.produto}`
    if (!grouped[key]) grouped[key] = { compras: [] }
    grouped[key].compras.push({ data: v.data, proximaCompra: v.proximaCompra, precoVenda: Number(v.precoVenda) })
  }

  const alertas: object[] = []
  const oportunidades: object[] = []

  for (const [key, val] of Object.entries(grouped)) {
    const [cliente, produto] = key.split('||')
    const sorted = val.compras.sort((a, b) => b.data.getTime() - a.data.getTime())
    const ultima = sorted[0]
    if (!ultima) continue

    // Ciclo medio from duracao between purchases
    let cicloMedio = 90
    if (sorted.length >= 2) {
      const diffs = []
      for (let i = 0; i < sorted.length - 1; i++) {
        diffs.push(Math.round((sorted[i].data.getTime() - sorted[i+1].data.getTime()) / 86400000))
      }
      cicloMedio = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
    }

    const diasSemComprar = Math.floor((today.getTime() - ultima.data.getTime()) / 86400000)
    const diasAtraso = diasSemComprar - cicloMedio

    if (diasAtraso > 0) {
      const urgencia = diasAtraso > cicloMedio * 0.5 ? 'critica' : diasAtraso > cicloMedio * 0.2 ? 'alta' : 'media'
      alertas.push({
        tipo: 'recompra', urgencia, cliente, produto, diasAtraso,
        ultimaCompra: ultima.data.toISOString().split('T')[0],
        cicloMedio, totalGasto: sorted.reduce((s, c) => s + c.precoVenda, 0),
      })
    }

    const proximaDate = ultima.proximaCompra
    const diasRestantes = Math.floor((proximaDate.getTime() - today.getTime()) / 86400000)
    if (diasRestantes <= 14) {
      const probabilidade = diasRestantes <= 0 ? 40 : diasRestantes <= 7 ? 70 : 55
      oportunidades.push({
        cliente, produto,
        diasRestantes,
        proximaCompra: proximaDate.toISOString().split('T')[0],
        probabilidade,
        valorEstimado: ultima.precoVenda,
      })
    }
  }

  // Sort
  const alertasSorted = (alertas as { diasAtraso: number }[]).sort((a, b) => b.diasAtraso - a.diasAtraso)
  const opsSorted = (oportunidades as { diasRestantes: number }[]).sort((a, b) => a.diasRestantes - b.diasRestantes)

  // Tendencias
  const now30 = new Date(today); now30.setDate(now30.getDate() - 30)
  const before30 = new Date(today); before30.setDate(before30.getDate() - 60)

  const prodMap: Record<string, { ult30: number; ant30: number; receita30: number }> = {}
  for (const v of vendas) {
    const d = v.data
    if (!prodMap[v.produto]) prodMap[v.produto] = { ult30: 0, ant30: 0, receita30: 0 }
    if (d >= now30) { prodMap[v.produto].ult30++; prodMap[v.produto].receita30 += Number(v.precoVenda) }
    else if (d >= before30) prodMap[v.produto].ant30++
  }

  const tendencias = Object.entries(prodMap)
    .map(([produto, d]) => ({
      produto,
      vendasUltimos30: d.ult30,
      vendasAntes30: d.ant30,
      variacao: d.ant30 > 0 ? ((d.ult30 - d.ant30) / d.ant30) * 100 : d.ult30 > 0 ? 100 : 0,
      receitaUltimos30: d.receita30,
    }))
    .sort((a, b) => b.vendasUltimos30 - a.vendasUltimos30)

  return NextResponse.json({
    alertas: alertasSorted.slice(0, 20),
    oportunidades: opsSorted.slice(0, 20),
    tendencias: tendencias.slice(0, 10),
    resumo: {
      atrasados: alertasSorted.length,
      proximos7dias: opsSorted.filter(o => o.diasRestantes >= 0 && o.diasRestantes <= 7).length,
      totalOportunidades: opsSorted.length,
    }
  })
}
