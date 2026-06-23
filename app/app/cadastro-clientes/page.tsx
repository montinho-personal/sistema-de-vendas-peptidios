'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/Toast'

interface Cliente { id: string; nome: string; telefone: string; email: string; cidade: string; aniversario: string | null; indicadoPor: string; observacoes: string; status: string }

const empty = { nome: '', telefone: '', email: '', cidade: '', aniversario: '', indicadoPor: '', observacoes: '', status: 'ativo' }

export default function CadastroClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/clientes'); setClientes(await res.json()); setLoading(false)
  }
  useEffect(() => { fetch_() }, [])

  function openNew() { setForm(empty); setEditing(null); setModal(true) }
  function openEdit(c: Cliente) {
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email, cidade: c.cidade,
      aniversario: c.aniversario ? c.aniversario.slice(0, 10) : '', indicadoPor: c.indicadoPor, observacoes: c.observacoes, status: c.status })
    setEditing(c); setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = editing ? `/api/clientes/${editing.id}` : '/api/clientes'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast(editing ? 'Cliente atualizado!' : 'Cliente cadastrado!'); setModal(false); fetch_() }
    else toast('Erro ao salvar', 'error')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir cliente?')) return
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    if (res.ok) { toast('Excluído'); fetch_() } else toast('Erro', 'error')
  }

  const filtrado = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca))

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c6fff] text-sm'

  return (
    <div>
      <Topbar title="👤 Cadastro de Clientes" actions={
        <button onClick={openNew} className="px-3 py-1.5 bg-[#7c6fff] rounded-lg text-sm text-white font-medium">+ Novo</button>
      } />

      <div className="mb-4">
        <input type="text" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)}
          className="bg-[#131626] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] w-72" />
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="px-3 py-3 text-left">Nome</th>
                <th className="px-3 py-3 text-left">Telefone</th>
                <th className="px-3 py-3 text-left">Cidade</th>
                <th className="px-3 py-3 text-left">Indicado Por</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              : filtrado.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2.5 text-white font-medium">{c.nome}</td>
                  <td className="px-3 py-2.5 text-gray-300">{c.telefone || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-400">{c.cidade || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-400">{c.indicadoPor || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs ${c.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-gray-500 hover:text-[#7c6fff]">✏️</button>
                      <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-400">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <form onSubmit={handleSave} className="space-y-3">
          <div><label className="text-xs text-gray-400 mb-1 block">Nome *</label>
            <input className={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Telefone/WhatsApp</label>
              <input className={inp} value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Cidade</label>
              <input className={inp} value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Aniversário</label>
              <input type="date" className={inp} value={form.aniversario} onChange={e => setForm(f => ({ ...f, aniversario: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Indicado Por</label>
            <input list="cls-ind" className={inp} value={form.indicadoPor} onChange={e => setForm(f => ({ ...f, indicadoPor: e.target.value }))} />
            <datalist id="cls-ind">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Observações</label>
            <textarea className={`${inp} h-20 resize-none`} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select></div>
          <button type="submit" disabled={saving} className="w-full bg-[#7c6fff] text-white py-2 rounded-lg font-semibold disabled:opacity-60">
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </Modal>
    </div>
  )
}
