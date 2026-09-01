'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/Toast'
import { toDateStr, formatBR, addDays, getMesAno } from '@/lib/date'

const PAGAMENTOS = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Transferência']
const PERIODOS = [
  { value: 'historico', label: 'Histórico' },
  { value: 'mes', label: 'Este Mês' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'ano', label: 'Ano' },
  { value: '7d', label: '7 Dias' },
  { value: '15d', label: '15 Dias' },
]

interface Venda {
  id: string
  data: string
  cliente: string
  produto: string
  quantidade: number
  precoVenda: number
  precoCusto: number
  lucroBruto: number
  taxa: number
  lucroLiquido: number
  formaPagamento: string
  proximaCompra: string
  diasDuracao: number
  mes: string
  ano: number
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('historico')
  const [busca, setBusca] = useState('')
  const [sortKey, setSortKey] = useState('data')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editando, setEditando] = useState<Venda | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [clientes, setClientes] = useState<string[]>([])
  const [produtos, setProdutos] = useState<string[]>([])

  const fetchVendas = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vendas?periodo=${periodo}&busca=${busca}&orderBy=${sortKey}&order=${sortOrder}`)
    const data = await res.json()
    setVendas(data)
    setLoading(false)
  }, [periodo, busca, sortKey, sortOrder])

  useEffect(() => { fetchVendas() }, [fetchVendas])
  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(d => setClientes(d.map((c: { nome: string }) => c.nome)))
    fetch('/api/produtos').then(r => r.json()).then(d => setProdutos(d.map((p: { nome: string }) => p.nome)))
  }, [])

  function handleSort(key: string) {
    if (sortKey === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortOrder('desc') }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-[#7c6fff] ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  async function handleSave() {
    if (!editando) return
    const lb = Number(editando.precoVenda) - Number(editando.precoCusto)
    const ll = lb - Number(editando.taxa)
    const pc = addDays(toDateStr(editando.data), Number(editando.diasDuracao))
    const { mes, ano } = getMesAno(toDateStr(editando.data))
    const res = await fetch(`/api/vendas/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editando, data: toDateStr(editando.data), lucroBruto: lb, lucroLiquido: ll, proximaCompra: pc, mes, ano }),
    })
    if (res.ok) { toast('Venda atualizada!'); setEditando(null); fetchVendas() }
    else toast('Erro ao atualizar', 'error')
  }

  async function handleDelete() {
    if (!excluindo) return
    const res = await fetch(`/api/vendas/${excluindo}`, { method: 'DELETE' })
    if (res.ok) { toast('Venda excluída'); setExcluindo(null); fetchVendas() }
    else toast('Erro ao excluir', 'error')
  }

  function exportCSV() {
    const sep = ';'
    const header = ['Data', 'Cliente', 'Produto', 'Qtd', 'Venda', 'Custo', 'L.Bruto', 'Taxa', 'L.Líquido', 'Pagamento', 'Próx.Compra'].join(sep)
    const rows = vendas.map(v => [
      formatBR(v.data), v.cliente, v.produto, v.quantidade,
      Number(v.precoVenda).toFixed(2), Number(v.precoCusto).toFixed(2), Number(v.lucroBruto).toFixed(2),
      Number(v.taxa).toFixed(2), Number(v.lucroLiquido).toFixed(2), v.formaPagamento,
      formatBR(v.proximaCompra),
    ].map(f => String(f).includes(sep) ? `"${f}"` : f).join(sep))
    const csv = '﻿' + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `vendas_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c6fff] text-sm'

  const totFat = vendas.reduce((s, v) => s + Number(v.precoVenda), 0)
  const totLL = vendas.reduce((s, v) => s + Number(v.lucroLiquido), 0)

  return (
    <div>
      <Topbar title="📋 Todas as Vendas" subtitle={`${vendas.length} registros`}
        actions={<button onClick={exportCSV} className="px-3 py-1.5 bg-[#1a1e30] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white">Exportar CSV</button>} />

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Buscar cliente, produto..." value={busca} onChange={e => setBusca(e.target.value)}
          className="bg-[#131626] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] w-64" />
        <div className="flex gap-1">
          {PERIODOS.map(p => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodo === p.value ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 hover:text-white border border-white/5'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#131626] border border-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400">Faturamento</p>
          <p className="text-lg font-bold text-white">R$ {totFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#131626] border border-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400">Lucro Líquido</p>
          <p className="text-lg font-bold text-green-400">R$ {totLL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                {[['data','Data'],['cliente','Cliente'],['produto','Produto'],['quantidade','Qtd'],['precoVenda','Venda'],['precoCusto','Custo'],['lucroBruto','L.Bruto'],['taxa','Taxa'],['lucroLiquido','L.Líquido'],['formaPagamento','Pgto'],['proximaCompra','Próx.Compra']].map(([k,l]) => (
                  <th key={k} onClick={() => handleSort(k)} className="px-3 py-3 text-left cursor-pointer hover:text-white whitespace-nowrap">
                    {l}<SortIcon col={k} />
                  </th>
                ))}
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              ) : vendas.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-gray-500">Nenhuma venda encontrada</td></tr>
              ) : vendas.map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-300">{formatBR(v.data)}</td>
                  <td className="px-3 py-2.5 text-white font-medium max-w-[140px] truncate">{v.cliente}</td>
                  <td className="px-3 py-2.5 text-gray-300 max-w-[140px] truncate">{v.produto}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{v.quantidade}</td>
                  <td className="px-3 py-2.5 text-right text-white">R${Number(v.precoVenda).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-right text-gray-400">R${Number(v.precoCusto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-right text-green-400">R${Number(v.lucroBruto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-right text-amber-400">R${Number(v.taxa).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-400">R${Number(v.lucroLiquido).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{v.formaPagamento}</td>
                  <td className="px-3 py-2.5 text-[#7c6fff] whitespace-nowrap">{formatBR(v.proximaCompra)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => setEditando({ ...v, data: toDateStr(v.data), proximaCompra: toDateStr(v.proximaCompra) })}
                        className="p-1 hover:text-[#7c6fff] text-gray-500 transition-colors">✏️</button>
                      <button onClick={() => setExcluindo(v.id)} className="p-1 hover:text-red-400 text-gray-500 transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edição */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Venda" size="lg">
        {editando && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Data</label>
                <input type="date" className={inp} value={editando.data} onChange={e => setEditando(v => v ? { ...v, data: e.target.value } : v)} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Qtd</label>
                <input type="number" className={inp} value={editando.quantidade} onChange={e => setEditando(v => v ? { ...v, quantidade: Number(e.target.value) } : v)} /></div>
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Cliente</label>
              <input list="clientes-edit" className={inp} value={editando.cliente} onChange={e => setEditando(v => v ? { ...v, cliente: e.target.value } : v)} />
              <datalist id="clientes-edit">{clientes.map(c => <option key={c} value={c} />)}</datalist></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Produto</label>
              <input list="produtos-edit" className={inp} value={editando.produto} onChange={e => setEditando(v => v ? { ...v, produto: e.target.value } : v)} />
              <datalist id="produtos-edit">{produtos.map(p => <option key={p} value={p} />)}</datalist></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Custo Total</label>
                <input type="number" step="0.01" className={inp} value={editando.precoCusto} onChange={e => setEditando(v => v ? { ...v, precoCusto: Number(e.target.value) } : v)} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Venda Total</label>
                <input type="number" step="0.01" className={inp} value={editando.precoVenda} onChange={e => setEditando(v => v ? { ...v, precoVenda: Number(e.target.value) } : v)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Dias Duração</label>
                <input type="number" className={inp} value={editando.diasDuracao} onChange={e => setEditando(v => v ? { ...v, diasDuracao: Number(e.target.value) } : v)} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Taxa</label>
                <input type="number" step="0.01" className={inp} value={editando.taxa} onChange={e => setEditando(v => v ? { ...v, taxa: Number(e.target.value) } : v)} /></div>
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Forma de Pagamento</label>
              <select className={inp} value={editando.formaPagamento} onChange={e => setEditando(v => v ? { ...v, formaPagamento: e.target.value } : v)}>
                {PAGAMENTOS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="bg-[#0d0f1a] rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">L.Bruto</span>
                <span className="text-green-400">R$ {(Number(editando.precoVenda) - Number(editando.precoCusto)).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">L.Líquido</span>
                <span className="text-green-400 font-bold">R$ {(Number(editando.precoVenda) - Number(editando.precoCusto) - Number(editando.taxa)).toFixed(2)}</span></div>
            </div>
            <button onClick={handleSave} className="w-full bg-[#7c6fff] hover:bg-[#6a5dee] text-white py-2 rounded-lg font-semibold">Salvar</button>
          </div>
        )}
      </Modal>

      {/* Modal Excluir */}
      <Modal open={!!excluindo} onClose={() => setExcluindo(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-4">Deseja excluir esta venda? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <button onClick={() => setExcluindo(null)} className="flex-1 bg-[#1a1e30] text-gray-300 py-2 rounded-lg">Cancelar</button>
          <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
