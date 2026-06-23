import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  // Buscar contexto
  const [vendas, vendasPerdidas] = await Promise.all([
    prisma.venda.findMany({ orderBy: { data: 'desc' } }),
    prisma.vendaPerdida.findMany(),
  ])

  const now = new Date()
  const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1)
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const vendasMes = vendas.filter((v: typeof vendas[0]) => new Date(v.data) >= mesAtual)
  const vendasMesAnt = vendas.filter((v: typeof vendas[0]) => {
    const d = new Date(v.data); return d >= mesAnterior && d < mesAtual
  })

  const faturamentoTotal = vendas.reduce((s, v) => s + Number(v.precoVenda), 0)
  const lucroTotal = vendas.reduce((s, v) => s + Number(v.lucroLiquido), 0)
  const margem = faturamentoTotal > 0 ? ((lucroTotal / faturamentoTotal) * 100).toFixed(1) : '0'
  const fatMes = vendasMes.reduce((s, v) => s + Number(v.precoVenda), 0)
  const fatMesAnt = vendasMesAnt.reduce((s, v) => s + Number(v.precoVenda), 0)
  const crescimento = fatMesAnt > 0 ? (((fatMes - fatMesAnt) / fatMesAnt) * 100).toFixed(1) : 'N/A'

  const porProduto: Record<string, { fat: number; meses: Record<string, number> }> = {}
  vendas.forEach((v) => {
    if (!porProduto[v.produto]) porProduto[v.produto] = { fat: 0, meses: {} }
    porProduto[v.produto].fat += Number(v.precoVenda)
    const d = new Date(v.data)
    const mk = `${d.getFullYear()}-${d.getMonth()}`
    porProduto[v.produto].meses[mk] = (porProduto[v.produto].meses[mk] || 0) + Number(v.precoVenda)
  })

  const top3Produtos = Object.entries(porProduto)
    .sort((a, b) => b[1].fat - a[1].fat)
    .slice(0, 3)
    .map(([nome, d]) => `${nome} (R$${d.fat.toLocaleString('pt-BR')})`)

  const porCliente: Record<string, number> = {}
  vendas.forEach((v) => { porCliente[v.cliente] = (porCliente[v.cliente] || 0) + Number(v.precoVenda) })
  const top5Clientes = Object.entries(porCliente)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([nome, fat]) => `${nome} (R$${fat.toLocaleString('pt-BR')})`)

  const totalPerdido = vendasPerdidas.reduce((s, v) => s + Number(v.valor), 0)
  const prodCritico = vendasPerdidas.length > 0
    ? Object.entries(vendasPerdidas.reduce((acc: Record<string, number>, v) => {
        acc[v.produto] = (acc[v.produto] || 0) + Number(v.valor); return acc
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0]
    : 'N/A'

  const systemContext = `Você é um consultor de negócios especializado em vendas de peptídios. Responda em português brasileiro, seja direto e prático.

CONTEXTO DO NEGÓCIO (hoje: ${now.toLocaleDateString('pt-BR')}):
- Faturamento total histórico: R$${faturamentoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Lucro total: R$${lucroTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Margem líquida: ${margem}%
- Crescimento mês atual vs anterior: ${crescimento}%
- Top 3 produtos: ${top3Produtos.join(', ')}
- Top 5 clientes: ${top5Clientes.join(', ')}
- Faturamento mês atual: R$${fatMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${vendasMes.length} pedidos)
- Vendas perdidas: R$${totalPerdido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} total | Produto mais crítico: ${prodCritico}`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemContext,
    messages: messages,
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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
