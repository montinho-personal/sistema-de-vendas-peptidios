'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/Toast'

interface Produto { id: string; nome: string; categoria: string; custoPadrao: number; vendaPadrao: number; duracaoPadrao: number; descricao: string; status: string }
const empty = { nome: '', categoria: '', custoPadrao: '', vendaPadrao: '', duracaoPadrao: '90', descricao: '', status: 'ativo' }

export default function CadastroProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const fetch_ = async () => { setLoading(true); setProdutos(await (await fetch('/api/produtos')).json()); setLoading(false) }
  useEffect(() => { fetch_() }, [])

  const margem = form.vendaPadrao && form.custoPadrao
    ? (((Number(form.vendaPadrao) - Number(form.custoPadrao)) / Number(form.vendaPadrao)) * 100).toFixed(1)
    : '—'

  function openNew() { setForm(empty); setEditing(null); setModal(true) }
  function openEdit(p: Produto) {
    setForm({ nome: p.nome, categoria: p.categoria, custoPadrao: String(p.custoPadrao), vendaPadrao: String(p.vendaPadrao), duracaoPadrao: String(p.duracaoPadrao), descricao: p.descricao, status: p.status })
    setEditing(p); setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = editing ? `/api/produtos/${editing.id}` : '/api/produtos'
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast(editing ? 'Atualizado!' : 'Cadastrado!'); setModal(false); fetch_() } else toast('Erro', 'error')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir produto?')) return
    if ((await fetch(`/api/produtos/${id}`, { method: 'DELETE' })).ok) { toast('Excluído'); fetch_() } else toast('Erro', 'error')
  }

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c6fff] text-sm'

  return (
    <div>
      <Topbar title="🏷️ Cadastro de Produtos" actions={
        <button onClick={openNew} className="px-3 py-1.5 bg-[#7c6fff] rounded-lg text-sm text-white font-medium">+ Novo</button>
      } />

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Nome</th>
                <th className="px-3 py-3 text-left">Categoria</th>
                <th className="px-3 py-3 text-right">Custo Padrão</th>
                <th className="px-3 py-3 text-right">Venda Padrão</th>
                <th className="px-3 py-3 text-right">Margem</th>
                <th className="px-3 py-3 text-center">Duração</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              : produtos.map(p => {
                const m = Number(p.vendaPadrao) > 0 ? (((Number(p.vendaPadrao) - Number(p.custoPadrao)) / Number(p.vendaPadrao)) * 100).toFixed(1) : '—'
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2.5 text-white font-medium">{p.nome}</td>
                    <td className="px-3 py-2.5 text-gray-400">{p.categoria || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">R$ {Number(p.custoPadrao).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-3 py-2.5 text-right text-white">R$ {Number(p.vendaPadrao).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-3 py-2.5 text-right text-green-400">{m}%</td>
                    <td className="px-3 py-2.5 text-center text-gray-400">{p.duracaoPadrao}d</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-[#7c6fff]">✏️</button>
                        <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-400">✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div><label className="text-xs text-gray-400 mb-1 block">Nome *</label>
            <input className={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Categoria</label>
            <input className={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Custo Padrão</label>
              <input type="number" step="0.01" className={inp} value={form.custoPadrao} onChange={e => setForm(f => ({ ...f, custoPadrao: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Venda Padrão</label>
              <input type="number" step="0.01" className={inp} value={form.vendaPadrao} onChange={e => setForm(f => ({ ...f, vendaPadrao: e.target.value }))} /></div>
          </div>
          {form.vendaPadrao && form.custoPadrao && (
            <div className="text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
              Margem: {margem}% — Lucro: R$ {(Number(form.vendaPadrao) - Number(form.custoPadrao)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          )}
          <div><label className="text-xs text-gray-400 mb-1 block">Duração Padrão (dias)</label>
            <input type="number" className={inp} value={form.duracaoPadrao} onChange={e => setForm(f => ({ ...f, duracaoPadrao: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <textarea className={`${inp} h-16 resize-none`} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
          <button type="submit" disabled={saving} className="w-full bg-[#7c6fff] text-white py-2 rounded-lg font-semibold disabled:opacity-60">
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </Modal>
    </div>
  )
}
