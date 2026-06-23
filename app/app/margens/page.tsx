'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'

interface MargemData {
  kpis: { margemBruta: number; margemLiquida: number; lucroBruto: number; lucroLiquido: number; totalTaxas: number; faturamento: number }
  porProduto: { nome: string; vendas: number; receitaTotal: number; custoTotal: number; lucroTotal: number; margem: number }[]
  porMes: { mes: string; faturamento: number; lucroBruto: number; lucroLiquido: number; margem: number }[]
}

export default function MargensPage() {
  const [data, setData] = useState<MargemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [simCusto, setSimCusto] = useState('')
  const [simVenda, setSimVenda] = useState('')
  const [simTaxa, setSimTaxa] = useState('0')

  useEffect(() => {
    fetch('/api/analytics/margens').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtPct = (n: number) => `${n.toFixed(1)}%`

  const simLucroBruto = simVenda && simCusto ? Number(simVenda) - Number(simCusto) : null
  const simLucroLiq = simLucroBruto !== null ? simLucroBruto - Number(simTaxa) : null
  const simMargem = simLucroLiq !== null && Number(simVenda) > 0 ? (simLucroLiq / Number(simVenda)) * 100 : null

  if (loading || !data) return (
    <div>
      <Topbar title="📐 Margens & Lucratividade" />
      <div className="text-center py-20 text-gray-500">Carregando...</div>
    </div>
  )

  const maxMargem = Math.max(...data.porProduto.map(p => p.margem), 1)

  return (
    <div>
      <Topbar title="📐 Margens & Lucratividade" subtitle="Análise de rentabilidade" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Faturamento Total', value: fmt(data.kpis.faturamento), color: 'text-white' },
          { label: 'Lucro Bruto', value: fmt(data.kpis.lucroBruto), color: 'text-green-400' },
          { label: 'Lucro Líquido', value: fmt(data.kpis.lucroLiquido), color: 'text-green-400' },
          { label: 'Margem Bruta', value: fmtPct(data.kpis.margemBruta), color: data.kpis.margemBruta > 30 ? 'text-green-400' : data.kpis.margemBruta > 15 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Margem Líquida', value: fmtPct(data.kpis.margemLiquida), color: data.kpis.margemLiquida > 25 ? 'text-green-400' : data.kpis.margemLiquida > 10 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Total em Taxas', value: fmt(data.kpis.totalTaxas), color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#131626] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Margem por Produto</h3>
          <div className="space-y-3">
            {data.porProduto.slice(0, 10).map(p => (
              <div key={p.nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 truncate">{p.nome}</span>
                  <span className={`ml-2 font-medium ${p.margem > 30 ? 'text-green-400' : p.margem > 15 ? 'text-amber-400' : 'text-red-400'}`}>{fmtPct(p.margem)}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full">
                  <div className={`h-full rounded-full ${p.margem > 30 ? 'bg-green-500' : p.margem > 15 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(p.margem / maxMargem) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">🧮 Simulador de Margem</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preço de Custo (R$)</label>
              <input type="number" step="0.01" value={simCusto} onChange={e => setSimCusto(e.target.value)}
                className="w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c6fff]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preço de Venda (R$)</label>
              <input type="number" step="0.01" value={simVenda} onChange={e => setSimVenda(e.target.value)}
                className="w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c6fff]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Taxa / Desconto (R$)</label>
              <input type="number" step="0.01" value={simTaxa} onChange={e => setSimTaxa(e.target.value)}
                className="w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c6fff]" />
            </div>
            {simLucroLiq !== null && (
              <div className={`rounded-xl p-4 ${simMargem! > 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">Lucro Bruto</p><p className="font-bold text-white">R$ {simLucroBruto!.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-400">Lucro Líquido</p><p className="font-bold text-white">R$ {simLucroLiq.toFixed(2)}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">Margem Líquida</p>
                    <p className={`text-2xl font-bold ${simMargem! > 30 ? 'text-green-400' : simMargem! > 15 ? 'text-amber-400' : 'text-red-400'}`}>{fmtPct(simMargem!)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-gray-300">Detalhamento por Produto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-center">Vendas</th>
                <th className="px-3 py-3 text-right">Receita</th>
                <th className="px-3 py-3 text-right">Custo</th>
                <th className="px-3 py-3 text-right">Lucro</th>
                <th className="px-3 py-3 text-center">Margem</th>
              </tr>
            </thead>
            <tbody>
              {data.porProduto.map(p => (
                <tr key={p.nome} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{p.nome}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{p.vendas}</td>
                  <td className="px-3 py-2.5 text-right text-gray-300">{fmt(p.receitaTotal)}</td>
                  <td className="px-3 py-2.5 text-right text-red-400">{fmt(p.custoTotal)}</td>
                  <td className="px-3 py-2.5 text-right text-green-400">{fmt(p.lucroTotal)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-medium ${p.margem > 30 ? 'text-green-400' : p.margem > 15 ? 'text-amber-400' : 'text-red-400'}`}>{fmtPct(p.margem)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
