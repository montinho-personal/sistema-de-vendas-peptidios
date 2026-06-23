'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { toast } from '@/components/Toast'

interface Meta { id: string; tipo: string; periodo: string; valorMeta: number; valorAtual: number; descricao: string }

function ProgressBar({ value, max, color = 'bg-[#7c6fff]' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full h-2 bg-white/5 rounded-full mt-2">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const now = new Date()
const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const trimAtual = `${now.getFullYear()}-T${Math.ceil((now.getMonth() + 1) / 3)}`
const anoAtual = String(now.getFullYear())

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipo: 'faturamento', periodo: mesAtual, valorMeta: '', descricao: '' })
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    fetch('/api/metas').then(r => r.json()).then(d => { setMetas(d); setLoading(false) })
  }
  useEffect(() => { fetch_() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/metas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast('Meta criada!'); setModal(false); fetch_() } else toast('Erro', 'error')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir meta?')) return
    if ((await fetch(`/api/metas/${id}`, { method: 'DELETE' })).ok) { toast('Excluída'); fetch_() }
  }

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c6fff] text-sm'

  const tipoLabel: Record<string, string> = { faturamento: 'Faturamento', lucro: 'Lucro', pedidos: 'Pedidos', clientes: 'Clientes Novos' }

  return (
    <div>
      <Topbar title="🎯 Metas" subtitle="Acompanhamento de objetivos" actions={
        <button onClick={() => setModal(true)} className="px-3 py-1.5 bg-[#7c6fff] rounded-lg text-sm text-white font-medium">+ Nova Meta</button>
      } />

      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : metas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-400 mb-2">Nenhuma meta cadastrada</p>
          <button onClick={() => setModal(true)} className="px-4 py-2 bg-[#7c6fff] text-white rounded-lg text-sm">Criar primeira meta</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metas.map(m => {
            const pct = Math.min((m.valorAtual / m.valorMeta) * 100, 100)
            const isMoney = m.tipo === 'faturamento' || m.tipo === 'lucro'
            const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-[#7c6fff]' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
            return (
              <div key={m.id} className="bg-[#131626] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">{tipoLabel[m.tipo] || m.tipo} · {m.periodo}</p>
                    <p className="text-sm text-white font-medium mt-0.5">{m.descricao || tipoLabel[m.tipo]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${pct >= 100 ? 'text-green-400' : pct >= 70 ? 'text-[#7c6fff]' : 'text-amber-400'}`}>{pct.toFixed(0)}%</span>
                    <button onClick={() => handleDelete(m.id)} className="text-gray-600 hover:text-red-400 text-sm">✕</button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Atual: <span className="text-white font-medium">{isMoney ? fmt(m.valorAtual) : m.valorAtual}</span></span>
                  <span className="text-gray-400">Meta: <span className="text-white font-medium">{isMoney ? fmt(m.valorMeta) : m.valorMeta}</span></span>
                </div>
                <ProgressBar value={m.valorAtual} max={m.valorMeta} color={color} />
                {pct >= 100 && <p className="text-xs text-green-400 mt-2">✅ Meta atingida!</p>}
                {pct < 100 && isMoney && (
                  <p className="text-xs text-gray-500 mt-2">Faltam {fmt(m.valorMeta - m.valorAtual)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-[#131626] border border-white/10 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white mb-4">Nova Meta</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                <select className={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="faturamento">Faturamento</option>
                  <option value="lucro">Lucro</option>
                  <option value="pedidos">Pedidos</option>
                  <option value="clientes">Clientes Novos</option>
                </select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Período</label>
                <input className={inp} value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}
                  placeholder="ex: 2025-06 ou 2025-T2 ou 2025" /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Valor da Meta</label>
                <input type="number" step="0.01" className={inp} value={form.valorMeta} onChange={e => setForm(f => ({ ...f, valorMeta: e.target.value }))} required /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Descrição (opcional)</label>
                <input className={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 bg-[#1a1e30] text-gray-300 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#7c6fff] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Criar Meta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
