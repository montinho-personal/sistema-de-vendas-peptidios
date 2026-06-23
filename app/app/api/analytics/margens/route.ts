import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({ orderBy: { data: 'asc' } })

  const totalFat = vendas.reduce((s, v) => s + Number(v.precoVenda), 0)
  const totalCusto = vendas.reduce((s, v) => s + Number(v.precoCusto), 0)
  const totalLucroBruto = vendas.reduce((s, v) => s + Number(v.lucroBruto), 0)
  const totalLucroLiq = vendas.reduce((s, v) => s + Number(v.lucroLiquido), 0)
  const totalTaxas = vendas.reduce((s, v) => s + Number(v.taxa), 0)

  // Por produto
  const prodMap: Record<string, { vendas: number; receita: number; custo: number; lucro: number }> = {}
  for (const v of vendas) {
    if (!prodMap[v.produto]) prodMap[v.produto] = { vendas: 0, receita: 0, custo: 0, lucro: 0 }
    prodMap[v.produto].vendas++
    prodMap[v.produto].receita += Number(v.precoVenda)
    prodMap[v.produto].custo += Number(v.precoCusto)
    prodMap[v.produto].lucro += Number(v.lucroBruto)
  }
  const porProduto = Object.entries(prodMap).map(([nome, d]) => ({
    nome, vendas: d.vendas, receitaTotal: d.receita, custoTotal: d.custo, lucroTotal: d.lucro,
    margem: d.receita > 0 ? (d.lucro / d.receita) * 100 : 0,
  })).sort((a, b) => b.receitaTotal - a.receitaTotal)

  // Por mês
  const mesMap: Record<string, { faturamento: number; lucroBruto: number; lucroLiquido: number }> = {}
  for (const v of vendas) {
    const mes = `${String(v.data.getFullYear()).slice(2)}/${String(v.data.getMonth() + 1).padStart(2, '0')}`
    if (!mesMap[mes]) mesMap[mes] = { faturamento: 0, lucroBruto: 0, lucroLiquido: 0 }
    mesMap[mes].faturamento += Number(v.precoVenda)
    mesMap[mes].lucroBruto += Number(v.lucroBruto)
    mesMap[mes].lucroLiquido += Number(v.lucroLiquido)
  }
  const porMes = Object.entries(mesMap).slice(-8).map(([mes, d]) => ({
    mes, ...d, margem: d.faturamento > 0 ? (d.lucroLiquido / d.faturamento) * 100 : 0,
  }))

  return NextResponse.json({
    kpis: {
      faturamento: totalFat,
      lucroBruto: totalLucroBruto,
      lucroLiquido: totalLucroLiq,
      margemBruta: totalFat > 0 ? (totalLucroBruto / totalFat) * 100 : 0,
      margemLiquida: totalFat > 0 ? (totalLucroLiq / totalFat) * 100 : 0,
      totalTaxas,
    },
    porProduto,
    porMes,
  })
}
