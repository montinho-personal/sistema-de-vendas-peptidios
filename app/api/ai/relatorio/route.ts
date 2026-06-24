import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { tipo } = await req.json()

  const [vendas, vendasPerdidas, clientes] = await Promise.all([
    prisma.venda.findMany({ orderBy: { data: 'asc' } }),
    prisma.vendaPerdida.findMany(),
    prisma.cadastroCliente.findMany(),
  ])

  const now = new Date()

  // Define o intervalo do período selecionado
  let periodoInicio: Date
  let periodoLabel: string
  if (tipo === 'anual') {
    periodoInicio = new Date(now.getFullYear(), 0, 1)
    periodoLabel = `Ano ${now.getFullYear()}`
  } else if (tipo === 'trimestral') {
    const trimestre = Math.floor(now.getMonth() / 3)
    periodoInicio = new Date(now.getFullYear(), trimestre * 3, 1)
    periodoLabel = `${trimestre + 1}º Trimestre de ${now.getFullYear()}`
  } else {
    periodoInicio = new Date(now.getFullYear(), now.getMonth(), 1)
    periodoLabel = `${now.toLocaleString('pt-BR', { month: 'long' })} de ${now.getFullYear()}`
  }

  const periodoAnteriorInicio = new Date(periodoInicio)
  if (tipo === 'anual') {
    periodoAnteriorInicio.setFullYear(periodoAnteriorInicio.getFullYear() - 1)
  } else if (tipo === 'trimestral') {
    periodoAnteriorInicio.setMonth(periodoAnteriorInicio.getMonth() - 3)
  } else {
    periodoAnteriorInicio.setMonth(periodoAnteriorInicio.getMonth() - 1)
  }

  type Venda = typeof vendas[0]
  type VendaPerdida = typeof vendasPerdidas[0]

  const vendasPeriodo = vendas.filter((v: Venda) => new Date(v.data) >= periodoInicio)
  const vendasPeriodoAnt = vendas.filter((v: Venda) => {
    const d = new Date(v.data)
    return d >= periodoAnteriorInicio && d < periodoInicio
  })

  const fatPeriodo = vendasPeriodo.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
  const lucroPeriodo = vendasPeriodo.reduce((s: number, v: Venda) => s + Number(v.lucroLiquido), 0)
  const fatAnt = vendasPeriodoAnt.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
  const crescimento = fatAnt > 0 ? (((fatPeriodo - fatAnt) / fatAnt) * 100).toFixed(1) : 'N/A'
  const margem = fatPeriodo > 0 ? ((lucroPeriodo / fatPeriodo) * 100).toFixed(1) : '0'

  const faturamentoTotal = vendas.reduce((s: number, v: Venda) => s + Number(v.precoVenda), 0)
  const lucroTotal = vendas.reduce((s: number, v: Venda) => s + Number(v.lucroLiquido), 0)
  const totalPerdido = vendasPerdidas.reduce((s: number, v: VendaPerdida) => s + Number(v.valor), 0)

  // Top produtos e clientes do período
  const porProduto: Record<string, number> = {}
  vendasPeriodo.forEach((v: Venda) => { porProduto[v.produto] = (porProduto[v.produto] || 0) + Number(v.precoVenda) })
  const top5 = Object.entries(porProduto).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const porCliente: Record<string, number> = {}
  vendasPeriodo.forEach((v: Venda) => { porCliente[v.cliente] = (porCliente[v.cliente] || 0) + Number(v.precoVenda) })
  const top5Clientes = Object.entries(porCliente).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Evolução mensal dentro do período
  const porMes: Record<string, number> = {}
  vendasPeriodo.forEach((v: Venda) => {
    const d = new Date(v.data)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    porMes[k] = (porMes[k] || 0) + Number(v.precoVenda)
  })
  const evolucao = Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `- ${k}: R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`)
    .join('\n')

  const tipoLabel = tipo === 'mensal' ? 'mensal' : tipo === 'trimestral' ? 'trimestral' : 'anual'

  const prompt = `Gere um relatório executivo ${tipoLabel} completo em markdown para este negócio de venda de peptídios:

PERÍODO: ${periodoLabel}
DATA DE GERAÇÃO: ${now.toLocaleDateString('pt-BR')}

DESEMPENHO DO PERÍODO:
- Faturamento: R$${fatPeriodo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${vendasPeriodo.length} pedidos)
- Lucro líquido: R$${lucroPeriodo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Margem líquida: ${margem}%
- vs período anterior: ${crescimento}% (R$${fatAnt.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
- Clientes únicos atendidos: ${new Set(vendasPeriodo.map((v: Venda) => v.cliente)).size}

EVOLUÇÃO MENSAL:
${evolucao || '- Sem dados suficientes'}

TOP 5 PRODUTOS DO PERÍODO:
${top5.length > 0 ? top5.map(([n, v]) => `- ${n}: R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`).join('\n') : '- Sem dados'}

TOP 5 CLIENTES DO PERÍODO:
${top5Clientes.length > 0 ? top5Clientes.map(([n, v]) => `- ${n}: R$${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`).join('\n') : '- Sem dados'}

CONTEXTO GERAL (histórico total):
- Faturamento histórico: R$${faturamentoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Lucro histórico: R$${lucroTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Carteira total: ${clientes.length} clientes | Vendas perdidas: R$${totalPerdido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}

Estruture o relatório com: Resumo Executivo do Período, Análise de Desempenho, Produtos em Destaque, Carteira de Clientes, Oportunidades Identificadas, Recomendações Estratégicas. Seja específico com os dados do período selecionado.`

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
