'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface PrevisaoData {
  historico: { mes: string; valor: number }[]
  projecao: { mes: string; conservador: number; realista: number; otimista: number }[]
  porProduto: { nome: string; mediaUltimos3: number; crescimento: number; proximo3Meses: number }[]
  totalProximo3Meses: { conservador: number; realista: number; otimista: number }
}

export default function PrevisaoPage() {
  const [data, setData] = useState<PrevisaoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/previsao').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  if (loading || !data) return (
    <div>
      <Topbar title="🔮 Previsão de Vendas" />
      <div className="text-center py-20 text-gray-500">Calculando previsões...</div>
    </div>
  )

  const allLabels = [...data.historico.map(h => h.mes), ...data.projecao.map(p => p.mes)]
  const historicoLen = data.historico.length
  const historicoData = [...data.historico.map(h => h.valor), ...Array(data.projecao.length).fill(null)]
  const conservadorData = [...Array(historicoLen - 1).fill(null), data.historico[historicoLen - 1]?.valor ?? null, ...data.projecao.map(p => p.conservador)]
  const realistaData = [...Array(historicoLen - 1).fill(null), data.historico[historicoLen - 1]?.valor ?? null, ...data.projecao.map(p => p.realista)]
  const otimistData = [...Array(historicoLen - 1).fill(null), data.historico[historicoLen - 1]?.valor ?? null, ...data.projecao.map(p => p.otimista)]

  const chartData = {
    labels: allLabels,
    datasets: [
      { label: 'Histórico', data: historicoData, borderColor: '#7c6fff', backgroundColor: '#7c6fff22', borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false },
      { label: 'Conservador', data: conservadorData, borderColor: '#6b7280', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: false },
      { label: 'Realista', data: realistaData, borderColor: '#22c55e', borderDash: [5, 5], borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false },
      { label: 'Otimista', data: otimistData, borderColor: '#f59e0b', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: false },
    ]
  }

  return (
    <div>
      <Topbar title="🔮 Previsão de Vendas" subtitle="Projeção para os próximos 6 meses" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Conservador (3 meses)', value: fmt(data.totalProximo3Meses.conservador), color: 'text-gray-300' },
          { label: 'Realista (3 meses)', value: fmt(data.totalProximo3Meses.realista), color: 'text-green-400' },
          { label: 'Otimista (3 meses)', value: fmt(data.totalProximo3Meses.otimista), color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#131626] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#131626] border border-white/5 rounded-2xl p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Histórico + Projeção (Faturamento Mensal)</h3>
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: R$ ${Number(ctx.raw).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` } }
          },
          scales: {
            x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { color: '#ffffff08' } },
            y: { ticks: { color: '#6b7280', font: { size: 11 }, callback: v => `R$${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` }, grid: { color: '#ffffff08' } }
          }
        }} />
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-gray-300">Previsão por Produto (próximos 3 meses)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-right">Média Últimos 3m</th>
                <th className="px-3 py-3 text-center">Crescimento</th>
                <th className="px-3 py-3 text-right">Projeção 3 meses</th>
              </tr>
            </thead>
            <tbody>
              {data.porProduto.length === 0
                ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">Dados insuficientes</td></tr>
                : data.porProduto.map(p => (
                  <tr key={p.nome} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2.5 text-white font-medium">{p.nome}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{fmt(p.mediaUltimos3)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-medium ${p.crescimento > 0 ? 'text-green-400' : p.crescimento < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {p.crescimento > 0 ? '+' : ''}{p.crescimento.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#7c6fff] font-medium">{fmt(p.proximo3Meses)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
