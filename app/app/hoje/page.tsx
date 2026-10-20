'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { formatBR } from '@/lib/date'

interface Alerta { tipo: string; urgencia: string; cliente: string; produto: string; diasAtraso: number; ultimaCompra: string; cicloMedio: number; totalGasto: number; telefone: string }
interface Oportunidade { cliente: string; produto: string; diasRestantes: number; proximaCompra: string; probabilidade: number; valorEstimado: number }
interface Tendencia { produto: string; vendasUltimos30: number; vendasAntes30: number; variacao: number; receitaUltimos30: number }

interface HojeData {
  alertas: Alerta[]
  alertasDispensados: (Alerta & { motivo: string })[]
  oportunidades: Oportunidade[]
  tendencias: Tendencia[]
  resumo: { atrasados: number; proximos7dias: number; totalOportunidades: number }
}

const urgColor = (u: string) => u === 'critica' ? 'text-red-400 bg-red-500/10 border-red-500/30' : u === 'alta' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'

export default function HojePage() {
  const [data, setData] = useState<HojeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'alertas'|'oportunidades'|'tendencias'>('alertas')
  const [verDispensados, setVerDispensados] = useState(false)

  const carregar = () => fetch('/api/analytics/hoje').then(r => r.json()).then(d => { setData(d); setLoading(false) })

  useEffect(() => { carregar() }, [])

  // Some o cartão na hora; o recarregamento confirma pelo servidor.
  async function dispensar(a: Alerta, motivo: 'contato' | 'descartado') {
    setData(d => d && ({
      ...d,
      alertas: d.alertas.filter(x => !(x.cliente === a.cliente && x.produto === a.produto)),
      resumo: { ...d.resumo, atrasados: Math.max(0, d.resumo.atrasados - 1) },
    }))
    await fetch('/api/alertas/dispensar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: a.cliente, produto: a.produto, ultimaCompra: a.ultimaCompra, motivo }),
    })
    carregar()
  }

  async function restaurar(a: Alerta) {
    await fetch('/api/alertas/dispensar', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: a.cliente, produto: a.produto, ultimaCompra: a.ultimaCompra }),
    })
    carregar()
  }

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  if (loading || !data) return (
    <div>
      <Topbar title="⚡ O Que Fazer Hoje" subtitle="Prioridades do dia" />
      <div className="text-center py-20 text-gray-500">Analisando...</div>
    </div>
  )

  return (
    <div>
      <Topbar title="⚡ O Que Fazer Hoje" subtitle="Prioridades do dia" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 cursor-pointer" onClick={() => setTab('alertas')}>
          <p className="text-xs text-gray-400">Recompras Atrasadas</p>
          <p className="text-2xl font-bold text-red-400">{data.resumo.atrasados}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 cursor-pointer" onClick={() => setTab('oportunidades')}>
          <p className="text-xs text-gray-400">Próximos 7 dias</p>
          <p className="text-2xl font-bold text-amber-400">{data.resumo.proximos7dias}</p>
        </div>
        <div className="bg-[#7c6fff]/10 border border-[#7c6fff]/30 rounded-xl p-3 cursor-pointer" onClick={() => setTab('oportunidades')}>
          <p className="text-xs text-gray-400">Oportunidades</p>
          <p className="text-2xl font-bold text-[#7c6fff]">{data.resumo.totalOportunidades}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {([['alertas','🚨 Alertas'],['oportunidades','💡 Oportunidades'],['tendencias','📈 Tendências']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === k ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 border border-white/5'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'alertas' && (
        <div className="space-y-2">
          {data.alertas.length === 0 && <div className="text-center py-12 text-gray-500">Nenhum alerta — tudo em dia!</div>}
          {data.alertas.map((a, i) => (
            <div key={i} className={`border rounded-xl p-4 ${urgColor(a.urgencia)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{a.cliente}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${urgColor(a.urgencia)}`}>{a.urgencia.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-gray-300">{a.produto}</p>
                  <p className="text-xs text-gray-500 mt-1">Ciclo médio: {a.cicloMedio}d · Total gasto: {fmt(a.totalGasto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{a.diasAtraso}d</p>
                  <p className="text-xs text-gray-400">em atraso</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {a.telefone && (
                  <a href={`https://wa.me/55${a.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    onClick={() => dispensar(a, 'contato')}
                    className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg hover:bg-green-500/30 transition-colors">
                    💬 WhatsApp
                  </a>
                )}
                <button onClick={() => dispensar(a, 'contato')}
                  className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg transition-colors">
                  ✓ Já falei
                </button>
                <button onClick={() => dispensar(a, 'descartado')}
                  className="text-xs text-gray-500 hover:text-red-400 border border-white/10 px-3 py-1 rounded-lg transition-colors">
                  ✕ Excluir
                </button>
              </div>
            </div>
          ))}

          {(data.alertasDispensados?.length ?? 0) > 0 && (
            <div className="pt-2">
              <button onClick={() => setVerDispensados(v => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {verDispensados ? '▾' : '▸'} {data.alertasDispensados.length} dispensado{data.alertasDispensados.length > 1 ? 's' : ''}
              </button>

              {verDispensados && (
                <div className="space-y-2 mt-2">
                  {data.alertasDispensados.map((a, i) => (
                    <div key={i} className="border border-white/5 bg-[#131626] rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-400 truncate">
                          <span className="text-gray-300">{a.cliente}</span> · {a.produto}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {a.diasAtraso}d em atraso · {a.motivo === 'descartado' ? 'excluído' : 'contato feito'}
                        </p>
                      </div>
                      <button onClick={() => restaurar(a)}
                        className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg shrink-0 transition-colors">
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'oportunidades' && (
        <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-center">Próxima Compra</th>
                <th className="px-3 py-3 text-center">Dias</th>
                <th className="px-3 py-3 text-center">Prob.</th>
                <th className="px-3 py-3 text-right">Val. Estimado</th>
              </tr>
            </thead>
            <tbody>
              {data.oportunidades.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Sem oportunidades próximas</td></tr>}
              {data.oportunidades.map((o, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{o.cliente}</td>
                  <td className="px-3 py-2.5 text-gray-300">{o.produto}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{formatBR(o.proximaCompra)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-medium ${o.diasRestantes <= 0 ? 'text-red-400' : o.diasRestantes <= 7 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {o.diasRestantes <= 0 ? `${Math.abs(o.diasRestantes)}d atrás` : `em ${o.diasRestantes}d`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-medium ${o.probabilidade >= 70 ? 'text-green-400' : o.probabilidade >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{o.probabilidade}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-white">{fmt(o.valorEstimado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tendencias' && (
        <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Produto</th>
                <th className="px-3 py-3 text-center">Vendas -30d</th>
                <th className="px-3 py-3 text-center">Vendas -60d</th>
                <th className="px-3 py-3 text-center">Variação</th>
                <th className="px-3 py-3 text-right">Receita -30d</th>
              </tr>
            </thead>
            <tbody>
              {data.tendencias.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Sem dados</td></tr>}
              {data.tendencias.map((t, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{t.produto}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.vendasUltimos30}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{t.vendasAntes30}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-medium ${t.variacao > 0 ? 'text-green-400' : t.variacao < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {t.variacao > 0 ? '+' : ''}{t.variacao.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-300">{fmt(t.receitaUltimos30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
