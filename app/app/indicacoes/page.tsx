'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'

interface IndicacaoItem {
  cliente: string; indicacoesDiretas: number; valorCadeia: number
  totalGastoProprioECadeia: number; profundidadeMaxima: number
  indicadoPor: string; score: number; categoria: string
}

export default function IndicacoesPage() {
  const [items, setItems] = useState<IndicacaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/analytics/scores').then(r => r.json()).then((d: Array<{nome:string;indicacoesDiretas:number;valorCadeia:number;totalGasto:number;indicadoPor:string;score:number;categoria:string}>) => {
      const mapped = d
        .filter(c => c.indicacoesDiretas > 0 || c.valorCadeia > 0)
        .map(c => ({
          cliente: c.nome,
          indicacoesDiretas: c.indicacoesDiretas,
          valorCadeia: c.valorCadeia,
          totalGastoProprioECadeia: c.totalGasto + c.valorCadeia,
          profundidadeMaxima: 1,
          indicadoPor: c.indicadoPor,
          score: c.score,
          categoria: c.categoria,
        }))
        .sort((a, b) => b.valorCadeia - a.valorCadeia)
      setItems(mapped)
      setLoading(false)
    })
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const filtered = items.filter(i =>
    !busca || i.cliente.toLowerCase().includes(busca.toLowerCase())
  )

  const totalCadeia = items.reduce((s, i) => s + i.valorCadeia, 0)
  const topInfluencer = items[0]

  return (
    <div>
      <Topbar title="🌐 Rede de Indicações" subtitle="Ranking de influenciadores" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#131626] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Influenciadores</p>
          <p className="text-2xl font-bold text-[#7c6fff]">{items.length}</p>
        </div>
        <div className="bg-[#131626] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Valor Total em Cadeia</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalCadeia)}</p>
        </div>
        <div className="bg-[#131626] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Top Influenciador</p>
          <p className="text-sm font-bold text-amber-400 truncate">{topInfluencer?.cliente || '—'}</p>
        </div>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}
          className="bg-[#131626] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] w-64" />
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-center w-10">#</th>
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">Indicado Por</th>
                <th className="px-3 py-3 text-center">Indicações Diretas</th>
                <th className="px-3 py-3 text-right">Valor em Cadeia</th>
                <th className="px-3 py-3 text-right">Total c/ Cadeia</th>
                <th className="px-3 py-3 text-center">Score</th>
                <th className="px-3 py-3 text-center">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Nenhum influenciador encontrado</td></tr>
              : filtered.map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-white font-medium">{item.cliente}</td>
                  <td className="px-3 py-2.5 text-gray-400">{item.indicadoPor || '—'}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{item.indicacoesDiretas}</td>
                  <td className="px-3 py-2.5 text-right text-green-400 font-medium">{fmt(item.valorCadeia)}</td>
                  <td className="px-3 py-2.5 text-right text-white">{fmt(item.totalGastoProprioECadeia)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-semibold ${item.score >= 70 ? 'text-[#7c6fff]' : item.score >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{item.score}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${item.categoria === 'Premium' ? 'bg-[#7c6fff]/20 text-[#7c6fff]' : item.categoria === 'Regular' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.categoria}
                    </span>
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
