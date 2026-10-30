'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Chart } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Tooltip, Legend)

const PERIODOS = [
  { value: 'mes', label: 'Mês' },
  { value: 'mes-passado', label: 'Mês passado' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'ano', label: 'Ano' },
  { value: 'historico', label: 'Histórico' },
]

const CRITERIOS = [
  { value: 'faturamento', label: 'Faturamento' },
  { value: 'lucro', label: 'Lucro' },
  { value: 'unidades', label: 'Unidades' },
] as const

type Criterio = typeof CRITERIOS[number]['value']

interface Mes { value: string; label: string }

interface Produto {
  posicao: number; produto: string; vendas: number; unidades: number
  faturamento: number; lucro: number; margem: number
  pct: number; pctAcumulado: number; classe: 'A' | 'B' | 'C'; top20: boolean
}

interface ResumoClasse { produtos: number; valor: number; pct: number }

interface AbcData {
  criterio: Criterio
  mesesDisponiveis: Mes[]
  total: number
  totalProdutos: number
  produtos: Produto[]
  classes: { A: ResumoClasse; B: ResumoClasse; C: ResumoClasse }
  top20: { produtos: number; pct: number }
}

const COR_CLASSE = {
  A: { texto: 'text-green-400', fundo: 'bg-green-500/10', borda: 'border-green-500/30', barra: '#22c55e' },
  B: { texto: 'text-amber-400', fundo: 'bg-amber-500/10', borda: 'border-amber-500/30', barra: '#f59e0b' },
  C: { texto: 'text-gray-400', fundo: 'bg-white/5', borda: 'border-white/10', barra: '#6b7280' },
}

const DESCRICAO_CLASSE = {
  A: 'Até 80% do total',
  B: 'De 80% a 95%',
  C: 'Últimos 5%',
}

export default function CurvaAbcPage() {
  const [periodo, setPeriodo] = useState('historico')
  const [criterio, setCriterio] = useState<Criterio>('faturamento')
  const [data, setData] = useState<AbcData | null>(null)
  const [loading, setLoading] = useState(true)
  // Mantido fora de `data` para o seletor não sumir durante os recarregamentos.
  const [meses, setMeses] = useState<Mes[]>([])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/abc?periodo=${periodo}&criterio=${criterio}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d.mesesDisponiveis) setMeses(d.mesesDisponiveis)
        setLoading(false)
      })
  }, [periodo, criterio])

  const mesSelecionado = meses.find(m => m.value === periodo)

  const fmtR = (n: number) => `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  const fmtValor = (n: number) => criterio === 'unidades' ? `${n.toLocaleString('pt-BR')} un.` : fmtR(n)
  const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  const valorDe = (p: Produto) => criterio === 'unidades' ? p.unidades : criterio === 'lucro' ? p.lucro : p.faturamento

  const botao = (ativo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ativo ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 hover:text-white border border-white/5'}`

  return (
    <div>
      <Topbar title="📈 Curva ABC" subtitle="Quais produtos sustentam o negócio" />

      <div className="flex flex-wrap items-center gap-1 mb-3">
        {PERIODOS.map(p => (
          <button key={p.value} onClick={() => setPeriodo(p.value)} className={botao(periodo === p.value)}>{p.label}</button>
        ))}
        {meses.length > 0 && (
          <select value={mesSelecionado ? periodo : ''} onChange={e => { if (e.target.value) setPeriodo(e.target.value) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:border-[#7c6fff] ${mesSelecionado ? 'bg-[#7c6fff] text-white border-transparent' : 'bg-[#131626] text-gray-400 border-white/5'}`}>
            <option value="">Escolher mês…</option>
            {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-500">Classificar por</span>
        <div className="flex gap-1">
          {CRITERIOS.map(c => (
            <button key={c.value} onClick={() => setCriterio(c.value)} className={botao(criterio === c.value)}>{c.label}</button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : data.produtos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nenhuma venda neste período.</div>
      ) : (
        <>
          {/* Destaque dos 20% */}
          <div className="bg-[#7c6fff]/10 border border-[#7c6fff]/30 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">Os 20% mais vendidos</p>
            <p className="text-white">
              <span className="text-2xl font-bold text-[#a89fff]">{data.top20.produtos}</span>
              <span className="text-sm text-gray-400"> de {data.totalProdutos} produtos geram </span>
              <span className="text-2xl font-bold text-[#a89fff]">{fmtPct(data.top20.pct)}</span>
              <span className="text-sm text-gray-400"> do {criterio === 'unidades' ? 'volume' : criterio}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {data.produtos.filter(p => p.top20).map(p => (
                <span key={p.produto} className="text-xs bg-[#7c6fff]/20 text-[#c4beff] px-2 py-1 rounded-md">
                  {p.posicao}. {p.produto}
                </span>
              ))}
            </div>
          </div>

          {/* Resumo por classe */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(['A', 'B', 'C'] as const).map(c => (
              <div key={c} className={`${COR_CLASSE[c].fundo} border ${COR_CLASSE[c].borda} rounded-xl p-3`}>
                <div className="flex items-baseline justify-between">
                  <p className={`text-2xl font-bold ${COR_CLASSE[c].texto}`}>{c}</p>
                  <p className="text-xs text-gray-400">{data.classes[c].produtos} prod.</p>
                </div>
                <p className="text-sm text-white font-medium mt-1">{fmtPct(data.classes[c].pct)}</p>
                <p className="text-xs text-gray-500">{DESCRICAO_CLASSE[c]}</p>
              </div>
            ))}
          </div>

          {/* Pareto */}
          <div className="bg-[#131626] border border-white/5 rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Gráfico de Pareto</h3>
            <Chart type="bar" data={{
              labels: data.produtos.map(p => p.produto),
              datasets: [
                {
                  type: 'line' as const,
                  label: '% acumulado',
                  data: data.produtos.map(p => p.pctAcumulado),
                  borderColor: '#a89fff',
                  backgroundColor: '#a89fff',
                  pointRadius: 2,
                  borderWidth: 2,
                  yAxisID: 'y1',
                },
                {
                  type: 'bar' as const,
                  label: CRITERIOS.find(c => c.value === criterio)?.label,
                  data: data.produtos.map(p => valorDe(p)),
                  backgroundColor: data.produtos.map(p => COR_CLASSE[p.classe].barra + 'bb'),
                  borderRadius: 4,
                  yAxisID: 'y',
                },
              ],
            }} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 60, minRotation: 45 }, grid: { display: false } },
                y: { position: 'left', ticks: { color: '#6b7280', font: { size: 10 }, callback: v => criterio === 'unidades' ? String(v) : `R$${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` }, grid: { color: '#ffffff08' } },
                y1: { position: 'right', min: 0, max: 100, ticks: { color: '#a89fff', font: { size: 10 }, callback: v => `${v}%` }, grid: { display: false } },
              },
            }} />
          </div>

          {/* Tabela */}
          <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-400">
                    <th className="px-3 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-center">Classe</th>
                    <th className="px-3 py-3 text-left">Produto</th>
                    <th className="px-3 py-3 text-right">Vendas</th>
                    <th className="px-3 py-3 text-right">Unid.</th>
                    <th className="px-3 py-3 text-right">Faturamento</th>
                    <th className="px-3 py-3 text-right">Lucro</th>
                    <th className="px-3 py-3 text-right">Margem</th>
                    <th className="px-3 py-3 text-right">% </th>
                    <th className="px-3 py-3 text-right">% Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.produtos.map(p => (
                    <tr key={p.produto} className={`border-b border-white/5 ${p.top20 ? 'bg-[#7c6fff]/5' : ''}`}>
                      <td className="px-3 py-2.5 text-gray-500">{p.posicao}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block w-6 text-xs font-bold rounded ${COR_CLASSE[p.classe].fundo} ${COR_CLASSE[p.classe].texto}`}>{p.classe}</span>
                      </td>
                      <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">
                        {p.produto}{p.top20 && <span className="ml-1.5 text-[10px] text-[#a89fff]">TOP 20%</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-300">{p.vendas}</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">{p.unidades}</td>
                      <td className="px-3 py-2.5 text-right text-white whitespace-nowrap">{fmtR(p.faturamento)}</td>
                      <td className={`px-3 py-2.5 text-right whitespace-nowrap ${p.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtR(p.lucro)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">{fmtPct(p.margem)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-300">{fmtPct(p.pct)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-400">{fmtPct(p.pctAcumulado)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-xs text-gray-400">
                    <td colSpan={10} className="px-3 py-3">Total do período: {fmtValor(data.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
