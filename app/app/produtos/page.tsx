'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'

interface ProdutoBCG {
  nome: string; categoria: string
  receitaTotal: number; crescimento: number; participacaoMercado: number
  vendas: number; margem: number; clientes: number
  quadrante: 'Estrela' | 'Vaca Leiteira' | 'Oportunidade' | 'Declínio'
}

interface ProdutoData { produtos: ProdutoBCG[] }

function QuadranteBadge({ q }: { q: string }) {
  const map: Record<string, string> = {
    'Estrela': 'bg-amber-500/20 text-amber-400',
    'Vaca Leiteira': 'bg-green-500/20 text-green-400',
    'Oportunidade': 'bg-blue-500/20 text-blue-400',
    'Declínio': 'bg-red-500/20 text-red-400',
  }
  const icons: Record<string, string> = { 'Estrela': '⭐', 'Vaca Leiteira': '🐄', 'Oportunidade': '💎', 'Declínio': '📉' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[q] || ''}`}>{icons[q]} {q}</span>
}

export default function ProdutosPage() {
  const [data, setData] = useState<ProdutoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos'|'Estrela'|'Vaca Leiteira'|'Oportunidade'|'Declínio'>('todos')

  useEffect(() => {
    fetch('/api/analytics/produtos').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const filtered = data?.produtos.filter(p => filtro === 'todos' || p.quadrante === filtro) ?? []

  const counts = {
    Estrela: data?.produtos.filter(p => p.quadrante === 'Estrela').length ?? 0,
    'Vaca Leiteira': data?.produtos.filter(p => p.quadrante === 'Vaca Leiteira').length ?? 0,
    Oportunidade: data?.produtos.filter(p => p.quadrante === 'Oportunidade').length ?? 0,
    Declínio: data?.produtos.filter(p => p.quadrante === 'Declínio').length ?? 0,
  }

  return (
    <div>
      <Topbar title="📦 Análise de Produtos" subtitle="Matriz BCG e performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { q: 'Estrela', color: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400', icon: '⭐' },
          { q: 'Vaca Leiteira', color: 'border-green-500/30 bg-green-500/5', text: 'text-green-400', icon: '🐄' },
          { q: 'Oportunidade', color: 'border-blue-500/30 bg-blue-500/5', text: 'text-blue-400', icon: '💎' },
          { q: 'Declínio', color: 'border-red-500/30 bg-red-500/5', text: 'text-red-400', icon: '📉' },
        ].map(({ q, color, text, icon }) => (
          <div key={q} className={`border rounded-xl p-3 cursor-pointer ${color}`} onClick={() => setFiltro(q as typeof filtro)}>
            <p className="text-xs text-gray-400">{icon} {q}</p>
            <p className={`text-2xl font-bold ${text}`}>{counts[q as keyof typeof counts]}</p>
            <p className="text-xs text-gray-500 mt-0.5">produtos</p>
          </div>
        ))}
      </div>

      <div className="mb-4 bg-[#131626] border border-white/5 rounded-xl p-4 text-xs text-gray-400 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div><span className="text-amber-400 font-medium">⭐ Estrela</span> — Alto crescimento + alta participação</div>
        <div><span className="text-green-400 font-medium">🐄 Vaca Leiteira</span> — Baixo crescimento + alta participação</div>
        <div><span className="text-blue-400 font-medium">💎 Oportunidade</span> — Alto crescimento + baixa participação</div>
        <div><span className="text-red-400 font-medium">📉 Declínio</span> — Baixo crescimento + baixa participação</div>
      </div>

      <div className="flex gap-1 mb-4">
        {(['todos','Estrela','Vaca Leiteira','Oportunidade','Declínio'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filtro === f ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 border border-white/5'}`}>
            {f === 'todos' ? 'Todos' : f}
          </button>
        ))}
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-left">Categoria</th>
                <th className="px-3 py-3 text-left">Quadrante</th>
                <th className="px-3 py-3 text-right">Receita Total</th>
                <th className="px-3 py-3 text-center">Vendas</th>
                <th className="px-3 py-3 text-center">Crescimento</th>
                <th className="px-3 py-3 text-center">Margem</th>
                <th className="px-3 py-3 text-center">Clientes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Analisando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Nenhum produto</td></tr>
              : filtered.map((p, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{p.nome}</td>
                  <td className="px-3 py-2.5 text-gray-400">{p.categoria || '—'}</td>
                  <td className="px-3 py-2.5"><QuadranteBadge q={p.quadrante} /></td>
                  <td className="px-3 py-2.5 text-right text-gray-300">{fmt(p.receitaTotal)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{p.vendas}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-medium ${p.crescimento > 0 ? 'text-green-400' : p.crescimento < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {p.crescimento > 0 ? '+' : ''}{p.crescimento.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`${p.margem > 30 ? 'text-green-400' : p.margem > 15 ? 'text-amber-400' : 'text-red-400'}`}>{p.margem.toFixed(1)}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{p.clientes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
