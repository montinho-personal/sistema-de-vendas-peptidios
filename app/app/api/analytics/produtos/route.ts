import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany()
  const produtos = await prisma.cadastroProduto.findMany()

  const today = new Date()
  const mes3Antes = new Date(today); mes3Antes.setMonth(mes3Antes.getMonth() - 3)
  const mes6Antes = new Date(today); mes6Antes.setMonth(mes6Antes.getMonth() - 6)

  const prodMap: Record<string, { nome: string; categoria: string; receita: number; custo: number; lucro: number; vendas: number; clientes: Set<string>; ult3m: number; ant3m: number }> = {}

  const catMap: Record<string, string> = {}
  produtos.forEach(p => { catMap[p.nome] = p.categoria })

  for (const v of vendas) {
    if (!prodMap[v.produto]) prodMap[v.produto] = { nome: v.produto, categoria: catMap[v.produto] || '', receita: 0, custo: 0, lucro: 0, vendas: 0, clientes: new Set(), ult3m: 0, ant3m: 0 }
    const p = prodMap[v.produto]
    p.receita += Number(v.precoVenda)
    p.custo += Number(v.precoCusto)
    p.lucro += Number(v.lucroBruto)
    p.vendas++
    p.clientes.add(v.cliente)
    if (v.data >= mes3Antes) p.ult3m++
    else if (v.data >= mes6Antes) p.ant3m++
  }

  const totalReceita = Object.values(prodMap).reduce((s, p) => s + p.receita, 0) || 1
  const maxUlt3m = Math.max(...Object.values(prodMap).map(p => p.ult3m), 1)

  const result = Object.values(prodMap).map(p => {
    const crescimento = p.ant3m > 0 ? ((p.ult3m - p.ant3m) / p.ant3m) * 100 : p.ult3m > 0 ? 100 : -100
    const participacaoMercado = (p.receita / totalReceita) * 100
    const altaCrescimento = crescimento > 10
    const altaParticipacao = participacaoMercado > (100 / Math.max(Object.keys(prodMap).length, 1))

    let quadrante: 'Estrela' | 'Vaca Leiteira' | 'Oportunidade' | 'Declínio'
    if (altaCrescimento && altaParticipacao) quadrante = 'Estrela'
    else if (!altaCrescimento && altaParticipacao) quadrante = 'Vaca Leiteira'
    else if (altaCrescimento && !altaParticipacao) quadrante = 'Oportunidade'
    else quadrante = 'Declínio'

    return {
      nome: p.nome, categoria: p.categoria,
      receitaTotal: p.receita, crescimento, participacaoMercado,
      vendas: p.vendas, margem: p.receita > 0 ? (p.lucro / p.receita) * 100 : 0,
      clientes: p.clientes.size, quadrante,
    }
  }).sort((a, b) => b.receitaTotal - a.receitaTotal)

  return NextResponse.json({ produtos: result })
}
