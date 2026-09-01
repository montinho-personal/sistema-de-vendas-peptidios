'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { toast } from '@/components/Toast'
import { formatBR, localDate, addDays, getMesAno } from '@/lib/date'

const PAGAMENTOS = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Transferência']

interface FormData {
  data: string
  cliente: string
  produto: string
  quantidade: string
  precoCusto: string
  precoVenda: string
  diasDuracao: string
  formaPagamento: string
  taxa: string
}

export default function NovaVendaPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<string[]>([])
  const [produtos, setProdutos] = useState<{ nome: string; custoPadrao: number; vendaPadrao: number; duracaoPadrao: number }[]>([])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>({
    data: localDate(),
    cliente: '',
    produto: '',
    quantidade: '1',
    precoCusto: '',
    precoVenda: '',
    diasDuracao: '90',
    formaPagamento: 'Pix',
    taxa: '0',
  })

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(d => setClientes(d.map((c: { nome: string }) => c.nome)))
    fetch('/api/produtos').then(r => r.json()).then(d => setProdutos(d))
  }, [])

  const lucroBruto = (Number(form.precoVenda) || 0) - (Number(form.precoCusto) || 0)
  const lucroLiquido = lucroBruto - (Number(form.taxa) || 0)
  const proximaCompra = form.data && form.diasDuracao ? addDays(form.data, Number(form.diasDuracao)) : ''

  function handleProdutoSelect(nome: string) {
    const p = produtos.find(x => x.nome === nome)
    setForm(f => ({
      ...f,
      produto: nome,
      precoCusto: p ? String(p.custoPadrao) : f.precoCusto,
      precoVenda: p ? String(p.vendaPadrao) : f.precoVenda,
      diasDuracao: p ? String(p.duracaoPadrao) : f.diasDuracao,
    }))
    setFiltroProduto('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cliente || !form.produto) { toast('Preencha cliente e produto', 'error'); return }
    setSaving(true)
    const { mes, ano } = getMesAno(form.data)
    const res = await fetch('/api/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        mes, ano,
        lucroBruto,
        lucroLiquido,
        proximaCompra,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast('Venda registrada com sucesso!')
      router.push('/app/vendas')
    } else {
      toast('Erro ao salvar venda', 'error')
    }
  }

  const clientesFiltrados = clientes.filter(c => c.toLowerCase().includes(filtroCliente.toLowerCase())).slice(0, 8)
  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(filtroProduto.toLowerCase())).slice(0, 8)

  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] transition-colors text-sm'
  const label = 'block text-xs font-medium text-gray-400 mb-1'

  return (
    <div>
      <Topbar title="➕ Nova Venda" subtitle="Registrar nova venda" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#131626] rounded-2xl border border-white/5 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Data */}
            <div>
              <label className={label}>Data da Venda</label>
              <input type="date" className={inp} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
            </div>

            {/* Cliente */}
            <div className="relative">
              <label className={label}>Cliente</label>
              <input
                type="text"
                className={inp}
                placeholder="Digite para buscar..."
                value={form.cliente || filtroCliente}
                onChange={e => { setFiltroCliente(e.target.value); setForm(f => ({ ...f, cliente: '' })) }}
              />
              {filtroCliente && !form.cliente && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1e30] border border-white/10 rounded-lg overflow-hidden">
                  {clientesFiltrados.map(c => (
                    <button key={c} type="button" onClick={() => { setForm(f => ({ ...f, cliente: c })); setFiltroCliente(c) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5">{c}</button>
                  ))}
                  <button type="button" onClick={() => { setForm(f => ({ ...f, cliente: filtroCliente })) }}
                    className="w-full text-left px-3 py-2 text-sm text-[#7c6fff] hover:bg-white/5 border-t border-white/5">
                    + Usar "{filtroCliente}" como novo cliente
                  </button>
                </div>
              )}
            </div>

            {/* Produto */}
            <div className="relative">
              <label className={label}>Produto</label>
              <input
                type="text"
                className={inp}
                placeholder="Digite para buscar..."
                value={form.produto || filtroProduto}
                onChange={e => { setFiltroProduto(e.target.value); setForm(f => ({ ...f, produto: '' })) }}
              />
              {filtroProduto && !form.produto && produtosFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1e30] border border-white/10 rounded-lg overflow-hidden">
                  {produtosFiltrados.map(p => (
                    <button key={p.nome} type="button" onClick={() => handleProdutoSelect(p.nome)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5">{p.nome}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Quantidade</label>
                <input type="number" min="1" className={inp} value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Dias de Duração</label>
                <input type="number" min="1" className={inp} value={form.diasDuracao} onChange={e => setForm(f => ({ ...f, diasDuracao: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Custo Total (R$)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.precoCusto} onChange={e => setForm(f => ({ ...f, precoCusto: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className={label}>Venda Total (R$)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.precoVenda} onChange={e => setForm(f => ({ ...f, precoVenda: e.target.value }))} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Forma de Pagamento</label>
                <select className={inp} value={form.formaPagamento} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))}>
                  {PAGAMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Taxa (R$)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.taxa} onChange={e => setForm(f => ({ ...f, taxa: e.target.value }))} placeholder="0.00" />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-[#7c6fff] hover:bg-[#6a5dee] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {saving ? 'Salvando...' : 'Registrar Venda'}
            </button>
          </form>
        </div>

        {/* Resumo */}
        <div className="space-y-4">
          <div className="bg-[#131626] rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Resumo da Venda</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Venda Total</span>
                <span className="text-white font-medium">R$ {(Number(form.precoVenda) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Custo Total</span>
                <span className="text-white">R$ {(Number(form.precoCusto) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                <span className="text-gray-400">Lucro Bruto</span>
                <span className={lucroBruto >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxa</span>
                <span className="text-amber-400">- R$ {(Number(form.taxa) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                <span className="text-gray-300 font-medium">Lucro Líquido</span>
                <span className={lucroLiquido >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {proximaCompra && (
                <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400">Próxima Compra</span>
                  <span className="text-[#7c6fff]">{formatBR(proximaCompra)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
