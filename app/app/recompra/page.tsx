'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { formatBR } from '@/lib/date'

interface RecompraItem {
  cliente: string; telefone: string; produto: string
  ultimaCompra: string; proximaCompra: string; diasRestantes: number
  cicloMedio: number; probabilidade: number; valorEstimado: number; status: string
}

interface RecompraData { items: RecompraItem[] }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    atrasado: 'bg-red-500/20 text-red-400',
    hoje: 'bg-amber-500/20 text-amber-400',
    esta_semana: 'bg-blue-500/20 text-blue-400',
    proximo: 'bg-green-500/20 text-green-400',
  }
  const labels: Record<string, string> = { atrasado: 'Atrasado', hoje: 'Hoje', esta_semana: 'Esta Semana', proximo: 'Próximo' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>{labels[status] || status}</span>
}

export default function RecompraPage() {
  const [data, setData] = useState<RecompraData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos'|'atrasado'|'esta_semana'|'proximo'>('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/analytics/recompra').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

  const filtered = data?.items.filter(i => {
    if (filtro !== 'todos' && i.status !== filtro) return false
    if (busca && !i.cliente.toLowerCase().includes(busca.toLowerCase()) && !i.produto.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }) ?? []

  const atrasados = data?.items.filter(i => i.status === 'atrasado').length ?? 0
  const semana = data?.items.filter(i => i.status === 'esta_semana' || i.status === 'hoje').length ?? 0

  return (
    <div>
      <Topbar title="🔄 Radar de Recompra" subtitle="Clientes para contactar" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-xs text-gray-400">Atrasados</p>
          <p className="text-2xl font-bold text-red-400">{atrasados}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-xs text-gray-400">Esta Semana</p>
          <p className="text-2xl font-bold text-amber-400">{semana}</p>
        </div>
        <div className="bg-[#131626] border border-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{data?.items.length ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Buscar cliente ou produto..." value={busca} onChange={e => setBusca(e.target.value)}
          className="bg-[#131626] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] w-64" />
        <div className="flex gap-1">
          {(['todos','atrasado','esta_semana','proximo'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filtro === f ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 border border-white/5'}`}>
              {f === 'todos' ? 'Todos' : f === 'atrasado' ? 'Atrasados' : f === 'esta_semana' ? 'Esta Semana' : 'Próximos'}
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
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-center">Última Compra</th>
                <th className="px-3 py-3 text-center">Próxima Compra</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Prob.</th>
                <th className="px-3 py-3 text-right">Val. Estimado</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Nenhum resultado</td></tr>
              : filtered.map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{item.cliente}</td>
                  <td className="px-3 py-2.5 text-gray-300">{item.produto}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{formatBR(item.ultimaCompra)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{formatBR(item.proximaCompra)}</td>
                  <td className="px-3 py-2.5 text-center"><StatusBadge status={item.status} /></td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-medium ${item.probabilidade >= 70 ? 'text-green-400' : item.probabilidade >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                      {item.probabilidade}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-white">{fmt(item.valorEstimado)}</td>
                  <td className="px-3 py-2.5">
                    {item.telefone && (
                      <a href={`https://wa.me/55${item.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-400 text-sm">💬</a>
                    )}
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
