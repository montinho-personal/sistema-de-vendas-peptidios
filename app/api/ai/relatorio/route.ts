import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const [vendas, vendasPerdidas, clientes] = await Promise.all([
    prisma.venda.findMany({ orderBy: { data: 'asc' } }),
    prisma.vendaPerdida.findMany(),
    prisma.cadastroCliente.findMany(),
  ])

  const now = new Date()
  const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1)
  const mesAnt = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  type Venda = typeof vendas[0]
  type VendaPerdida = typeof vendasPerdidas[0]
  const vendasMes = vendas.filter((v: Venda) => new Date(v.data) >= mesAtual)
  const vendasMesAnt = vendas.filter((v: Venda) => { const d = new Date(v.data); return d >= mesAnt && d < mesAtual })

  const porMes: Record<string, number> = {}
  vendas.forEach((v: Venda) => {
    const d = new Date(v.data)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    porMes[k] = (porMes[k] || 0) + Number(v.precoVenda)
  })
  const mesesOrdenados = Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0]))
  const ult3 = mesesOrdenados.slice(-3).map(([, v]) => v)
  const media3 = ult3.length > 0 ? ult3.reduce((a: number, b: number) => a + b, 0) / ult3.length : 0

  const porProduto: Record<string, number> = {}
  vendas.forEach((v: Venda) => { porProduto[v.produto] = (porProduto[v.produto] || 0) + Number(v.precoVenda) })
  const top5 = Object.entries(porProduto).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const porCliente: Record<string, number> = {}
  vendas.forEach((v: Venda) => { porCliente[v.cliente] = (porCliente[v.cliente] || 0) + Number(v.precoVenda) })

  const faturamentoTotal = vendas.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
  const lucroTotal = vendas.reduce((s: number, v: Venda) => s + Number(v.lucroLiquido), 0)
  const totalPerdido = vendasPerdidas.reduce((s: number, v: VendaPerdida) => s + Number(v.valor), 0)

  const prompt = `Gere um relatório executivo completo em markdown para este negócio de venda de peptídios:

DATA: ${now.toLocaleDateString('pt-BR')}

RESUMO FINANCEIRO:
- Faturamento total histórico: R$${faturamentoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Lucro líquido total: R$${lucroTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Margem líquida: ${faturamentoTotal > 0 ? ((lucroTotal / faturamentoTotal) * 100).toFixed(1) : 0}%
- Mês atual: R$${vendasMes.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${vendasMes.length} pedidos)
- Mês anterior: R$${vendasMesAnt.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Previsão próximo mês (média 3 meses): R$${Math.round(media3).toLocaleString('pt-BR')}
- Vendas perdidas total: R$${totalPerdido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${vendasPerdidas.length} registros)

TOP 5 PRODUTOS:
${top5.map(([n, v]) => `- ${n}: R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`).join('\n')}

TOP 5 CLIENTES:
${Object.entries(porCliente).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => `- ${n}: R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`).join('\n')}

CARTEIRA: ${clientes.length} clientes cadastrados | ${Object.keys(porCliente).length} com compras

Estruture o relatório com: Resumo Executivo, Análise de Desempenho, Produtos em Destaque, Carteira de Clientes, Oportunidades Identificadas, Recomendações Estratégicas. Seja específico com os dados fornecidos.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
