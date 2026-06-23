'use client'

import { useState, useEffect, useRef } from 'react'
import { Topbar } from '@/components/Topbar'

interface IntelData {
  faturamentoMes: number; faturamentoMesAnterior: number; crescimento: number
  margemMedia: number; ticketMedio: number; clientesAtivos: number
  produtoTop: string; clienteTop: string; totalVendasMes: number
}

export default function IntelPage() {
  const [data, setData] = useState<IntelData | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [report, setReport] = useState('')
  const [tipo, setTipo] = useState<'mensal'|'trimestral'|'anual'>('mensal')
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/analytics/dashboard?periodo=mes').then(r => r.json()).then(d => {
      setData({
        faturamentoMes: d.kpis.faturamento,
        faturamentoMesAnterior: 0,
        crescimento: 0,
        margemMedia: d.kpis.margem,
        ticketMedio: d.kpis.ticketMedio,
        clientesAtivos: d.kpis.pedidos,
        produtoTop: d.topProdutos[0]?.nome || '—',
        clienteTop: d.topClientes[0]?.nome || '—',
        totalVendasMes: d.kpis.pedidos,
      })
    })
  }, [])

  async function gerarRelatorio() {
    setStreaming(true); setReport('')
    const res = await fetch('/api/ai/relatorio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo })
    })
    if (!res.body) { setStreaming(false); return }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setReport(p => p + dec.decode(value))
      if (reportRef.current) reportRef.current.scrollTop = reportRef.current.scrollHeight
    }
    setStreaming(false)
  }

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div>
      <Topbar title="🧠 Inteligência do Negócio" subtitle="Análise executiva com IA" />

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Faturamento Mês', value: fmt(data.faturamentoMes), color: 'text-[#7c6fff]' },
            { label: 'Margem Média', value: `${data.margemMedia.toFixed(1)}%`, color: data.margemMedia > 30 ? 'text-green-400' : 'text-amber-400' },
            { label: 'Ticket Médio', value: fmt(data.ticketMedio), color: 'text-white' },
            { label: 'Produto Top', value: data.produtoTop, color: 'text-amber-400' },
          ].map(k => (
            <div key={k.label} className="bg-[#131626] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-sm font-bold truncate ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#131626] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Relatório Executivo com IA</h3>
            <p className="text-xs text-gray-500 mt-0.5">Análise gerada pelo Claude com base nos seus dados reais</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}
              className="bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#7c6fff]">
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
            <button onClick={gerarRelatorio} disabled={streaming}
              className="px-4 py-1.5 bg-[#7c6fff] text-white text-sm rounded-lg font-medium disabled:opacity-60 flex items-center gap-2">
              {streaming ? (<><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gerando...</>) : '✨ Gerar Relatório'}
            </button>
          </div>
        </div>

        {report ? (
          <div ref={reportRef} className="bg-[#0d0f1a] rounded-xl p-4 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
            {streaming && <span className="inline-block w-2 h-4 bg-[#7c6fff] animate-pulse ml-1" />}
          </div>
        ) : (
          <div className="bg-[#0d0f1a] rounded-xl p-8 text-center text-gray-600">
            <p className="text-3xl mb-2">🤖</p>
            <p className="text-sm">Clique em "Gerar Relatório" para obter uma análise executiva completa do seu negócio.</p>
          </div>
        )}

        {report && !streaming && (
          <div className="mt-3 flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(report) }}
              className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">
              📋 Copiar
            </button>
            <button onClick={() => setReport('')}
              className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">
              🗑️ Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
