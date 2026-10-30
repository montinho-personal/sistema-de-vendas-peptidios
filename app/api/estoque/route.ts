import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lotesComSaldo, chaveProduto } from '@/lib/estoque'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [lotes, movimentos, pagamentos] = await Promise.all([
      lotesComSaldo(prisma),
      prisma.movimentoEstoque.findMany({ orderBy: [{ data: 'desc' }, { createdAt: 'desc' }] }),
      prisma.pagamentoFornecedor.findMany({ orderBy: [{ data: 'desc' }, { createdAt: 'desc' }] }),
    ])

    const vendaIds = [...new Set(movimentos.map((m: { vendaId: string | null }) => m.vendaId).filter(Boolean))] as string[]
    const vendas = vendaIds.length
      ? await prisma.venda.findMany({ where: { id: { in: vendaIds } }, select: { id: true, cliente: true } })
      : []
    const clientePorVenda: Record<string, string> = {}
    vendas.forEach((v: { id: string; cliente: string }) => { clientePorVenda[v.id] = v.cliente })

    const lotePorId = Object.fromEntries(lotes.map(l => [l.id, l]))

    // Saídas de cada lote por tipo
    const saidas: Record<string, { venda: number; devolucao: number; perda: number }> = {}
    for (const m of movimentos) {
      if (!saidas[m.loteId]) saidas[m.loteId] = { venda: 0, devolucao: 0, perda: 0 }
      const t = m.tipo as 'venda' | 'devolucao' | 'perda'
      if (t in saidas[m.loteId]) saidas[m.loteId][t] += m.quantidade
    }

    const lotesDetalhe = lotes.map(l => ({
      ...l,
      dataRecebimento: l.dataRecebimento.toISOString().slice(0, 10),
      vendido: saidas[l.id]?.venda ?? 0,
      devolvido: saidas[l.id]?.devolucao ?? 0,
      perdido: saidas[l.id]?.perda ?? 0,
    }))

    // Saldo por produto
    const porProduto: Record<string, { produto: string; saldo: number; consignado: number; proprio: number; valorCusto: number; recebido: number; vendido: number }> = {}
    for (const l of lotesDetalhe) {
      const k = chaveProduto(l.produto)
      if (!porProduto[k]) porProduto[k] = { produto: l.produto.trim(), saldo: 0, consignado: 0, proprio: 0, valorCusto: 0, recebido: 0, vendido: 0 }
      const p = porProduto[k]
      p.saldo += l.saldo
      if (l.tipo === 'consignado') p.consignado += l.saldo
      else p.proprio += l.saldo
      p.valorCusto += l.saldo * l.custoUnitario
      p.recebido += l.quantidade
      p.vendido += l.vendido
    }

    // Conta com cada fornecedor de consignado: deve o que vendeu ou perdeu, menos o que já pagou.
    const forn: Record<string, {
      fornecedor: string; recebidoUn: number; recebidoValor: number; vendidoUn: number; vendidoValor: number
      devolvidoUn: number; devolvidoValor: number; perdidoUn: number; perdidoValor: number
      emEstoqueUn: number; emEstoqueValor: number; pago: number; aPagar: number
    }> = {}
    const novoForn = (nome: string) => ({ fornecedor: nome, recebidoUn: 0, recebidoValor: 0, vendidoUn: 0, vendidoValor: 0, devolvidoUn: 0, devolvidoValor: 0, perdidoUn: 0, perdidoValor: 0, emEstoqueUn: 0, emEstoqueValor: 0, pago: 0, aPagar: 0 })
    for (const l of lotesDetalhe.filter(x => x.tipo === 'consignado')) {
      const nome = l.fornecedor.trim() || 'Sem fornecedor'
      const f = forn[nome] ??= novoForn(nome)
      f.recebidoUn += l.quantidade; f.recebidoValor += l.quantidade * l.custoUnitario
      f.vendidoUn += l.vendido; f.vendidoValor += l.vendido * l.custoUnitario
      f.devolvidoUn += l.devolvido; f.devolvidoValor += l.devolvido * l.custoUnitario
      f.perdidoUn += l.perdido; f.perdidoValor += l.perdido * l.custoUnitario
      f.emEstoqueUn += l.saldo; f.emEstoqueValor += l.saldo * l.custoUnitario
    }
    for (const pg of pagamentos) {
      const nome = pg.fornecedor.trim() || 'Sem fornecedor'
      const f = forn[nome] ??= novoForn(nome)
      f.pago += Number(pg.valor)
    }
    Object.values(forn).forEach(f => { f.aPagar = f.vendidoValor + f.perdidoValor - f.pago })

    return NextResponse.json({
      produtos: Object.values(porProduto).sort((a, b) => a.produto.localeCompare(b.produto)),
      lotes: lotesDetalhe.slice().reverse(),
      fornecedores: Object.values(forn).sort((a, b) => b.aPagar - a.aPagar),
      movimentos: movimentos.slice(0, 200).map((m: { id: string; loteId: string; tipo: string; quantidade: number; vendaId: string | null; data: Date; observacao: string }) => ({
        id: m.id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        data: m.data.toISOString().slice(0, 10),
        observacao: m.observacao,
        produto: lotePorId[m.loteId]?.produto ?? '—',
        fornecedor: lotePorId[m.loteId]?.fornecedor ?? '',
        custoUnitario: lotePorId[m.loteId]?.custoUnitario ?? 0,
        cliente: m.vendaId ? clientePorVenda[m.vendaId] ?? '' : '',
      })),
      pagamentos: pagamentos.map((p: { id: string; fornecedor: string; data: Date; valor: unknown; observacao: string }) => ({
        id: p.id, fornecedor: p.fornecedor, data: p.data.toISOString().slice(0, 10), valor: Number(p.valor), observacao: p.observacao,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
