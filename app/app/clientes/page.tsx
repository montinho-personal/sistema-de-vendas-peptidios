'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'

interface Score {
  id: string; nome: string; telefone: string; score: number; categoria: string
  totalGasto: number; pedidos: number; ticketMedio: number
  probabilidadeRecompra: number; cicloMedio: number; diasSemComprar: number
  ultimaCompra: string | null; indicacoesDiretas: number; valorCadeia: number; indicadoPor: string
}

function Badge({ cat }: { cat: string }) {
  const c = cat === 'Premium' ? 'bg-[#7c6fff]/20 text-[#7c6fff]' : cat === 'Regular' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{cat}</span>
}

function ScoreBar({ value }: { value: number }) {
  const c = value >= 70 ? 'bg-[#7c6fff]' : value >= 45 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full"><div className={`h-full rounded-full ${c}`} style={{ width: `${value}%` }} /></div>
      <span className="text-xs text-gray-400 w-6 text-right">{value}</span>
    </div>
  )
}

export default function ClientesScorePage() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos'|'Premium'|'Regular'|'Em Risco'>('todos')
  const [busca, setBusca] = useState('')
  const [selected, setSelected] = useState<Score | null>(null)

  useEffect(() => {
    fetch('/api/analytics/scores').then(r => r.json()).then(d => { setScores(d); setLoading(false) })
  }, [])

  const filtered = scores.filter(s => {
    if (filtro !== 'todos' && s.categoria !== filtro) return false
    if (busca && !s.nome.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const premium = scores.filter(s => s.categoria === 'Premium').length
  const regular = scores.filter(s => s.categoria === 'Regular').length
  const risco = scores.filter(s => s.categoria === 'Em Risco').length

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div>
      <Topbar title="👥 Score de Clientes" subtitle={`${scores.length} clientes analisados`} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#131626] border border-[#7c6fff]/30 rounded-xl p-3 cursor-pointer" onClick={() => setFiltro('Premium')}>
          <p className="text-xs text-gray-400">Premium ≥70</p>
          <p className="text-2xl font-bold text-[#7c6fff]">{premium}</p>
        </div>
        <div className="bg-[#131626] border border-amber-500/30 rounded-xl p-3 cursor-pointer" onClick={() => setFiltro('Regular')}>
          <p className="text-xs text-gray-400">Regular 45–69</p>
          <p className="text-2xl font-bold text-amber-400">{regular}</p>
        </div>
        <div className="bg-[#131626] border border-red-500/30 rounded-xl p-3 cursor-pointer" onClick={() => setFiltro('Em Risco')}>
          <p className="text-xs text-gray-400">Em Risco &lt;45</p>
          <p className="text-2xl font-bold text-red-400">{risco}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}
          className="bg-[#131626] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] w-56" />
        <div className="flex gap-1">
          {(['todos','Premium','Regular','Em Risco'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 border border-white/5'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">Score</th>
                <th className="px-3 py-3 text-left">Categoria</th>
                <th className="px-3 py-3 text-right">Total Gasto</th>
                <th className="px-3 py-3 text-center">Pedidos</th>
                <th className="px-3 py-3 text-center">Prob. Recompra</th>
                <th className="px-3 py-3 text-center">Dias Sem Comprar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">Calculando scores...</td></tr>
              : filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)} className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5 text-white font-medium">{s.nome}</td>
                  <td className="px-3 py-2.5 w-32"><ScoreBar value={s.score} /></td>
                  <td className="px-3 py-2.5"><Badge cat={s.categoria} /></td>
                  <td className="px-3 py-2.5 text-right text-gray-300">{fmt(s.totalGasto)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{s.pedidos}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-medium ${s.probabilidadeRecompra >= 70 ? 'text-green-400' : s.probabilidadeRecompra >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.probabilidadeRecompra}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={s.diasSemComprar > s.cicloMedio * 1.5 ? 'text-red-400' : s.diasSemComprar > s.cicloMedio ? 'text-amber-400' : 'text-gray-400'}>
                      {s.diasSemComprar === 9999 ? '—' : `${s.diasSemComprar}d`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Perfil: ${selected?.nome}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge cat={selected.categoria} />
                  <span className="text-2xl font-bold text-white">{selected.score}<span className="text-sm text-gray-400">/100</span></span>
                </div>
                <ScoreBar value={selected.score} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Gasto', value: fmt(selected.totalGasto) },
                { label: 'Pedidos', value: String(selected.pedidos) },
                { label: 'Ticket Médio', value: fmt(selected.ticketMedio) },
                { label: 'Prob. Recompra', value: `${selected.probabilidadeRecompra}%` },
                { label: 'Ciclo Médio', value: `${selected.cicloMedio} dias` },
                { label: 'Dias Sem Comprar', value: selected.diasSemComprar === 9999 ? '—' : `${selected.diasSemComprar}d` },
                { label: 'Última Compra', value: selected.ultimaCompra ? new Date(selected.ultimaCompra).toLocaleDateString('pt-BR') : '—' },
                { label: 'Indicações Diretas', value: String(selected.indicacoesDiretas) },
                { label: 'Valor em Cadeia', value: fmt(selected.valorCadeia) },
                { label: 'Indicado Por', value: selected.indicadoPor || '—' },
              ].map(k => (
                <div key={k.label} className="bg-[#0d0f1a] rounded-lg p-3">
                  <p className="text-xs text-gray-500">{k.label}</p>
                  <p className="text-sm text-white font-medium mt-0.5">{k.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
