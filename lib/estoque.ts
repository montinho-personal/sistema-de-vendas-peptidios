import type { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

/** Nomes de produto são texto livre; espaço sobrando ou maiúscula não podem separar estoques. */
export const chaveProduto = (nome: string) => nome.trim().toLowerCase()

export interface LoteComSaldo {
  id: string
  produto: string
  tipo: string
  fornecedor: string
  dataRecebimento: Date
  quantidade: number
  custoUnitario: number
  saldo: number
}

/**
 * Lotes com o saldo de cada um. O saldo é sempre calculado (recebido menos
 * saídas), nunca guardado, então não tem como divergir do histórico.
 */
export async function lotesComSaldo(tx: Tx, produto?: string): Promise<LoteComSaldo[]> {
  const [lotes, saidas] = await Promise.all([
    tx.loteEstoque.findMany({ orderBy: [{ dataRecebimento: 'asc' }, { createdAt: 'asc' }] }),
    tx.movimentoEstoque.groupBy({ by: ['loteId'], _sum: { quantidade: true } }),
  ])
  const saidoPorLote: Record<string, number> = {}
  saidas.forEach((s: { loteId: string; _sum: { quantidade: number | null } }) => {
    saidoPorLote[s.loteId] = s._sum.quantidade ?? 0
  })

  const alvo = produto === undefined ? null : chaveProduto(produto)
  return lotes
    .filter((l: { produto: string }) => alvo === null || chaveProduto(l.produto) === alvo)
    .map((l: { id: string; produto: string; tipo: string; fornecedor: string; dataRecebimento: Date; quantidade: number; custoUnitario: Prisma.Decimal }) => ({
      id: l.id,
      produto: l.produto,
      tipo: l.tipo,
      fornecedor: l.fornecedor,
      dataRecebimento: l.dataRecebimento,
      quantidade: l.quantidade,
      custoUnitario: Number(l.custoUnitario),
      saldo: l.quantidade - (saidoPorLote[l.id] ?? 0),
    }))
}

/**
 * Dá baixa de uma venda no estoque, do lote mais antigo para o mais novo.
 * Se não houver saldo suficiente, baixa o que tiver e devolve quanto faltou:
 * a venda nunca é bloqueada por falta de estoque registrado.
 */
export async function darBaixaVenda(
  tx: Tx,
  venda: { id: string; produto: string; quantidade: number; data: Date },
): Promise<{ baixado: number; faltou: number }> {
  let restante = venda.quantidade
  const lotes = (await lotesComSaldo(tx, venda.produto)).filter(l => l.saldo > 0)

  for (const lote of lotes) {
    if (restante <= 0) break
    const qtd = Math.min(lote.saldo, restante)
    await tx.movimentoEstoque.create({
      data: { loteId: lote.id, tipo: 'venda', quantidade: qtd, vendaId: venda.id, data: venda.data },
    })
    restante -= qtd
  }

  return { baixado: venda.quantidade - restante, faltou: restante }
}

/** Devolve ao estoque o que uma venda tinha consumido. */
export async function estornarVenda(tx: Tx, vendaId: string) {
  await tx.movimentoEstoque.deleteMany({ where: { vendaId, tipo: 'venda' } })
}
