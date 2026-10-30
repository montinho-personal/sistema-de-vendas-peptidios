import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Criterio = 'faturamento' | 'lucro' | 'unidades'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'historico'
  const criterioParam = searchParams.get('criterio')
  const criterio: Criterio = criterioParam === 'lucro' || criterioParam === 'unidades' ? criterioParam : 'faturamento'

  // Limites em UTC, como as colunas `date` voltam do Postgres.
  const now = new Date()
  const ano = now.getUTCFullYear()
  const mes = now.getUTCMonth()
  let from: Date | undefined
  let to: Date | undefined
  const mesEspecifico = /^(\d{4})-(\d{2})$/.exec(periodo)

  if (mesEspecifico) {
    from = new Date(Date.UTC(Number(mesEspecifico[1]), Number(mesEspecifico[2]) - 1, 1))
    to = new Date(Date.UTC(Number(mesEspecifico[1]), Number(mesEspecifico[2]), 1))
  }
  else if (periodo === 'mes') from = new Date(Date.UTC(ano, mes, 1))
  else if (periodo === 'mes-passado') { from = new Date(Date.UTC(ano, mes - 1, 1)); to = new Date(Date.UTC(ano, mes, 1)) }
  else if (periodo === 'trimestre') from = new Date(Date.UTC(ano, Math.floor(mes / 3) * 3, 1))
  else if (periodo === 'semestre') from = new Date(Date.UTC(ano, Math.floor(mes / 6) * 6, 1))
  else if (periodo === 'ano') from = new Date(Date.UTC(ano, 0, 1))

  const where = from ? { data: to ? { gte: from, lt: to } : { gte: from } } : {}
  const [vendas, datas] = await Promise.all([
    prisma.venda.findMany({ where }),
    prisma.venda.findMany({ select: { data: true } }),
  ])

  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const chaves = new Set<string>()
  datas.forEach((d: { data: Date }) => chaves.add(`${d.data.getUTCFullYear()}-${String(d.data.getUTCMonth() + 1).padStart(2, '0')}`))
  const mesesDisponiveis = [...chaves].sort().reverse().map(value => {
    const [a, m] = value.split('-')
    return { value, label: `${MESES[Number(m) - 1]}/${a}` }
  })

  // Nomes com espaço sobrando no fim ("Tesamorelin 10mg ") contam como o mesmo produto.
  const mapa: Record<string, { vendas: number; unidades: number; faturamento: number; lucro: number }> = {}
  for (const v of vendas) {
    const nome = v.produto.trim()
    if (!mapa[nome]) mapa[nome] = { vendas: 0, unidades: 0, faturamento: 0, lucro: 0 }
    mapa[nome].vendas++
    mapa[nome].unidades += v.quantidade
    mapa[nome].faturamento += Number(v.precoVenda)
    mapa[nome].lucro += Number(v.lucroLiquido)
  }

  const linhas = Object.entries(mapa)
    .map(([produto, d]) => ({ produto, ...d, valor: d[criterio] }))
    .sort((a, b) => b.valor - a.valor)

  // Lucro pode ser negativo; só a parte positiva entra na curva.
  const total = linhas.reduce((s, l) => s + Math.max(l.valor, 0), 0)
  const corte20 = Math.max(1, Math.ceil(linhas.length * 0.2))

  let acumulado = 0
  const produtos = linhas.map((l, i) => {
    const antes = total > 0 ? (acumulado / total) * 100 : 100
    acumulado += Math.max(l.valor, 0)
    const pct = total > 0 ? (Math.max(l.valor, 0) / total) * 100 : 0
    // O item que cruza o limite fica na classe de cima.
    const classe = antes < 80 ? 'A' : antes < 95 ? 'B' : 'C'
    return {
      posicao: i + 1,
      produto: l.produto,
      vendas: l.vendas,
      unidades: l.unidades,
      faturamento: l.faturamento,
      lucro: l.lucro,
      margem: l.faturamento > 0 ? (l.lucro / l.faturamento) * 100 : 0,
      pct,
      pctAcumulado: total > 0 ? (acumulado / total) * 100 : 0,
      classe,
      top20: i < corte20,
    }
  })

  const resumoClasse = (c: string) => {
    const itens = produtos.filter(p => p.classe === c)
    return {
      produtos: itens.length,
      valor: itens.reduce((s, p) => s + Math.max(p[criterio], 0), 0),
      pct: itens.reduce((s, p) => s + p.pct, 0),
    }
  }
  const top = produtos.filter(p => p.top20)

  return NextResponse.json({
    criterio,
    mesesDisponiveis,
    total,
    totalProdutos: produtos.length,
    produtos,
    classes: { A: resumoClasse('A'), B: resumoClasse('B'), C: resumoClasse('C') },
    top20: {
      produtos: top.length,
      pct: top.reduce((s, p) => s + p.pct, 0),
    },
  })
}
