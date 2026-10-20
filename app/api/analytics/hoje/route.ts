import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({ orderBy: { data: 'desc' } })
  const dispensados = await prisma.alertaDispensado.findMany()
  const today = new Date()

  // Chave do alerta: cliente + produto + o ciclo a que ele se refere.
  type Dispensado = typeof dispensados[0]
  const chaveDispensa = (cliente: string, produto: string, ultimaCompra: string) =>
    `${cliente}||${produto}||${ultimaCompra}`
  const dispensadosMap: Record<string, string> = {}
  dispensados.forEach((d: Dispensado) => {
    const dia = d.ultimaCompra.toISOString().split('T')[0]
    dispensadosMap[chaveDispensa(d.cliente, d.produto, dia)] = d.motivo
  })

  // Get client phones
  const clientes = await prisma.cadastroCliente.findMany()
  const phoneMap: Record<string, string> = {}
  type Cliente = typeof clientes[0]
  clientes.forEach((c: Cliente) => { phoneMap[c.nome] = c.telefone })

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
        telefone: phoneMap[cliente] || '',
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

  type Alerta = { cliente: string; produto: string; ultimaCompra: string; diasAtraso: number }
  const motivoDe = (a: Alerta) => dispensadosMap[chaveDispensa(a.cliente, a.produto, a.ultimaCompra)]
  const alertasAtivos = (alertasSorted as Alerta[]).filter(a => !motivoDe(a))
  const alertasDispensados = (alertasSorted as Alerta[])
    .filter(a => motivoDe(a))
    .map(a => ({ ...a, motivo: motivoDe(a) }))
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
    alertas: alertasAtivos.slice(0, 20),
    alertasDispensados,
    oportunidades: opsSorted.slice(0, 20),
    tendencias: tendencias.slice(0, 10),
    resumo: {
      atrasados: alertasAtivos.length,
      proximos7dias: opsSorted.filter(o => o.diasRestantes >= 0 && o.diasRestantes <= 7).length,
      totalOportunidades: opsSorted.length,
    }
  })
}
