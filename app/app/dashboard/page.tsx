'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const PERIODOS = [
  { value: '7d', label: '7 dias' },
  { value: '15d', label: '15 dias' },
  { value: 'mes', label: 'Mês' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'ano', label: 'Ano' },
  { value: 'historico', label: 'Histórico' },
]

interface DashData {
  kpis: { vendasHoje: number; faturamento: number; lucroBruto: number; lucroLiquido: number; pedidos: number; ticketMedio: number; margem: number }
  grafico: { mes: string; faturamento: number; lucro: number }[]
  topProdutos: { nome: string; total: number }[]
  topClientes: { nome: string; total: number }[]
}

function KPI({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#131626] border border-white/5 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/dashboard?periodo=${periodo}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [periodo])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div>
      <Topbar title="📊 Dashboard" subtitle="Visão geral do negócio" />

      <div className="flex flex-wrap gap-1 mb-6">
        {PERIODOS.map(p => (
          <button key={p.value} onClick={() => setPeriodo(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodo === p.value ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 hover:text-white border border-white/5'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPI label="Vendas Hoje" value={fmt(data.kpis.vendasHoje)} color="text-[#7c6fff]" />
            <KPI label="Faturamento" value={fmt(data.kpis.faturamento)} />
            <KPI label="Lucro Bruto" value={fmt(data.kpis.lucroBruto)} color="text-green-400" />
            <KPI label="Lucro Líquido" value={fmt(data.kpis.lucroLiquido)} color="text-green-400" />
            <KPI label="Pedidos" value={String(data.kpis.pedidos)} />
            <KPI label="Ticket Médio" value={fmt(data.kpis.ticketMedio)} />
            <KPI label="Margem %" value={`${data.kpis.margem.toFixed(1)}%`} color={data.kpis.margem > 30 ? 'text-green-400' : data.kpis.margem > 15 ? 'text-amber-400' : 'text-red-400'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Faturamento Mensal (últimos 8 meses)</h3>
              <Bar data={{
                labels: data.grafico.map(m => m.mes),
                datasets: [{ label: 'Faturamento', data: data.grafico.map(m => m.faturamento), backgroundColor: '#7c6fff88', borderColor: '#7c6fff', borderWidth: 1, borderRadius: 4 }],
              }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { color: '#ffffff08' } }, y: { ticks: { color: '#6b7280', font: { size: 11 }, callback: (v) => `R$${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}` }, grid: { color: '#ffffff08' } } } }} />
            </div>
            <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Lucro Mensal (últimos 8 meses)</h3>
              <Bar data={{
                labels: data.grafico.map(m => m.mes),
                datasets: [{ label: 'Lucro Líquido', data: data.grafico.map(m => m.lucro), backgroundColor: '#22c55e55', borderColor: '#22c55e', borderWidth: 1, borderRadius: 4 }],
              }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { color: '#ffffff08' } }, y: { ticks: { color: '#6b7280', font: { size: 11 }, callback: (v) => `R$${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}` }, grid: { color: '#ffffff08' } } } }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">🏆 Top 5 Produtos</h3>
              <div className="space-y-2">
                {data.topProdutos.map((p, i) => {
                  const max = data.topProdutos[0]?.total || 1
                  return (
                    <div key={p.nome}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate">{i + 1}. {p.nome}</span>
                        <span className="text-white font-medium ml-2">{fmt(p.total)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full"><div className="h-full bg-[#7c6fff] rounded-full" style={{ width: `${(p.total / max) * 100}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">👥 Top 5 Clientes</h3>
              <div className="space-y-2">
                {data.topClientes.map((c, i) => {
                  const max = data.topClientes[0]?.total || 1
                  return (
                    <div key={c.nome}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate">{i + 1}. {c.nome}</span>
                        <span className="text-white font-medium ml-2">{fmt(c.total)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(c.total / max) * 100}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
