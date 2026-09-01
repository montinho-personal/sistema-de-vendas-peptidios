'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/Toast'
import { formatBR, localDate } from '@/lib/date'

const MOTIVOS = ['Sem estoque', 'Preço alto', 'Concorrência', 'Cliente desistiu', 'Prazo', 'Outro']

interface VP { id: string; data: string; cliente: string; produto: string; valor: number; quantidade: number; motivo: string }

export default function VendasPerdidasPage() {
  const [items, setItems] = useState<VP[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sortKey, setSortKey] = useState('data')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')
  const [clientes, setClientes] = useState<string[]>([])
  const [produtos, setProdutos] = useState<string[]>([])
  const [form, setForm] = useState({ data: localDate(), cliente: '', produto: '', valor: '', quantidade: '1', motivo: 'Sem estoque' })

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/vendas-perdidas'); const d = await res.json(); setItems(d); setLoading(false)
  }

  useEffect(() => {
    fetch_()
    fetch('/api/clientes').then(r=>r.json()).then(d=>setClientes(d.map((c:{nome:string})=>c.nome)))
    fetch('/api/produtos').then(r=>r.json()).then(d=>setProdutos(d.map((p:{nome:string})=>p.nome)))
  }, [])

  function handleSort(k: string) {
    if (sortKey === k) setSortOrder(o => o==='asc'?'desc':'asc')
    else { setSortKey(k); setSortOrder('desc') }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/vendas-perdidas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast('Registrado!'); setModal(false); setForm({ data: localDate(), cliente:'', produto:'', valor:'', quantidade:'1', motivo:'Sem estoque' }); fetch_() }
    else toast('Erro', 'error')
  }

  async function handleDelete() {
    if (!excluindo) return
    const res = await fetch(`/api/vendas-perdidas/${excluindo}`, { method: 'DELETE' })
    if (res.ok) { toast('Excluído'); setExcluindo(null); fetch_() }
    else toast('Erro', 'error')
  }

  const now = new Date()
  const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalHist = items.reduce((s, v) => s + Number(v.valor), 0)
  const totalMes = items.filter(v => new Date(v.data) >= mesAtual).reduce((s, v) => s + Number(v.valor), 0)
  const porProduto: Record<string,number> = {}
  items.forEach(v => { porProduto[v.produto] = (porProduto[v.produto]||0) + Number(v.valor) })
  const critico = Object.entries(porProduto).sort((a,b)=>b[1]-a[1])[0]

  const sorted = [...items].sort((a,b) => {
    const av = (a as unknown as Record<string,unknown>)[sortKey] as string|number
    const bv = (b as unknown as Record<string,unknown>)[sortKey] as string|number
    return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c6fff] text-sm'

  return (
    <div>
      <Topbar title="⚠️ Vendas Perdidas" actions={
        <button onClick={() => setModal(true)} className="px-3 py-1.5 bg-[#7c6fff] rounded-lg text-sm text-white font-medium">+ Registrar</button>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Perdido', value: `R$ ${totalHist.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, color: 'text-red-400' },
          { label: 'Perdido Este Mês', value: `R$ ${totalMes.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, color: 'text-amber-400' },
          { label: 'Registros', value: items.length, color: 'text-white' },
          { label: 'Produto Crítico', value: critico?.[0] || '—', color: 'text-[#7c6fff]' },
        ].map(k => (
          <div key={k.label} className="bg-[#131626] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-base font-bold truncate ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                {[['data','Data'],['cliente','Cliente'],['produto','Produto'],['valor','Valor Perdido'],['quantidade','Qtd'],['motivo','Motivo']].map(([k,l])=>(
                  <th key={k} onClick={()=>handleSort(k)} className="px-3 py-3 text-left cursor-pointer hover:text-white">{l} {sortKey===k?(sortOrder==='asc'?'↑':'↓'):'↕'}</th>
                ))}
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              : sorted.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum registro</td></tr>
              : sorted.map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-gray-300">{formatBR(v.data)}</td>
                  <td className="px-3 py-2.5 text-white">{v.cliente}</td>
                  <td className="px-3 py-2.5 text-gray-300">{v.produto}</td>
                  <td className="px-3 py-2.5 text-red-400 font-medium">R$ {Number(v.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400">{v.quantidade}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">{v.motivo}</span></td>
                  <td className="px-3 py-2.5"><button onClick={()=>setExcluindo(v.id)} className="text-gray-500 hover:text-red-400">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Venda Perdida">
        <form onSubmit={handleSave} className="space-y-3">
          <div><label className="text-xs text-gray-400 mb-1 block">Data</label>
            <input type="date" className={inp} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} required /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Cliente</label>
            <input list="cls-vp" className={inp} value={form.cliente} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))} required />
            <datalist id="cls-vp">{clientes.map(c=><option key={c} value={c}/>)}</datalist></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Produto</label>
            <input list="pds-vp" className={inp} value={form.produto} onChange={e=>setForm(f=>({...f,produto:e.target.value}))} required />
            <datalist id="pds-vp">{produtos.map(p=><option key={p} value={p}/>)}</datalist></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Valor (R$)</label>
              <input type="number" step="0.01" className={inp} value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} required /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Quantidade</label>
              <input type="number" min="1" className={inp} value={form.quantidade} onChange={e=>setForm(f=>({...f,quantidade:e.target.value}))} /></div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Motivo</label>
            <select className={inp} value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))}>
              {MOTIVOS.map(m=><option key={m}>{m}</option>)}</select></div>
          <button type="submit" disabled={saving} className="w-full bg-[#7c6fff] text-white py-2 rounded-lg font-semibold disabled:opacity-60">
            {saving?'Salvando...':'Registrar'}</button>
        </form>
      </Modal>

      <Modal open={!!excluindo} onClose={()=>setExcluindo(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-4">Excluir este registro?</p>
        <div className="flex gap-2">
          <button onClick={()=>setExcluindo(null)} className="flex-1 bg-[#1a1e30] text-gray-300 py-2 rounded-lg">Cancelar</button>
          <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
