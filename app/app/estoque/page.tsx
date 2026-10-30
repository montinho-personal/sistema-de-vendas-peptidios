'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/Toast'
import { formatBR, localDate } from '@/lib/date'

interface Produto { produto: string; saldo: number; consignado: number; proprio: number; valorCusto: number; recebido: number; vendido: number }
interface Lote {
  id: string; produto: string; tipo: string; fornecedor: string; dataRecebimento: string
  quantidade: number; custoUnitario: number; saldo: number; vendido: number; devolvido: number; perdido: number
}
interface Fornecedor {
  fornecedor: string; recebidoUn: number; recebidoValor: number; vendidoUn: number; vendidoValor: number
  devolvidoUn: number; devolvidoValor: number; perdidoUn: number; perdidoValor: number
  emEstoqueUn: number; emEstoqueValor: number; pago: number; aPagar: number
}
interface Movimento { id: string; tipo: string; quantidade: number; data: string; observacao: string; produto: string; fornecedor: string; custoUnitario: number; cliente: string }
interface Pagamento { id: string; fornecedor: string; data: string; valor: number; observacao: string }
interface EstoqueData { produtos: Produto[]; lotes: Lote[]; fornecedores: Fornecedor[]; movimentos: Movimento[]; pagamentos: Pagamento[] }

const ABAS = [['saldo', '📦 Saldo'], ['consignado', '🤝 Consignado'], ['recebimentos', '📥 Recebimentos'], ['movimentos', '🔁 Movimentações']] as const
type Aba = typeof ABAS[number][0]

const TIPO_MOV: Record<string, { label: string; cor: string }> = {
  venda: { label: 'Venda', cor: 'text-green-400 bg-green-500/10' },
  devolucao: { label: 'Devolução', cor: 'text-blue-400 bg-blue-500/10' },
  perda: { label: 'Perda', cor: 'text-red-400 bg-red-500/10' },
}

const LOTE_VAZIO = { produto: '', tipo: 'consignado', fornecedor: '', dataRecebimento: localDate(), quantidade: '', custoUnitario: '', observacao: '' }

export default function EstoquePage() {
  const [data, setData] = useState<EstoqueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('saldo')
  const [catalogo, setCatalogo] = useState<{ nome: string; custoPadrao: number }[]>([])

  const [modalLote, setModalLote] = useState(false)
  const [editandoLote, setEditandoLote] = useState<string | null>(null)
  const [formLote, setFormLote] = useState(LOTE_VAZIO)

  const [modalSaida, setModalSaida] = useState(false)
  const [formSaida, setFormSaida] = useState({ loteId: '', tipo: 'devolucao', quantidade: '', data: localDate(), observacao: '' })

  const [modalPgto, setModalPgto] = useState(false)
  const [formPgto, setFormPgto] = useState({ fornecedor: '', valor: '', data: localDate(), observacao: '' })

  const [salvando, setSalvando] = useState(false)

  const carregar = () => fetch('/api/estoque', { cache: 'no-store' }).then(r => r.json()).then(d => {
    if (d.error) toast(d.error, 'error')
    else setData(d)
    setLoading(false)
  })

  useEffect(() => {
    carregar()
    fetch('/api/produtos').then(r => r.json()).then(d => setCatalogo(d.map((p: { nome: string; custoPadrao: number }) => ({ nome: p.nome, custoPadrao: Number(p.custoPadrao) }))))
  }, [])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const inp = 'w-full bg-[#0d0f1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c6fff]'
  const lbl = 'block text-xs text-gray-400 mb-1'

  const fornecedoresConhecidos = [...new Set([
    ...(data?.lotes.map(l => l.fornecedor) ?? []),
    ...(data?.pagamentos.map(p => p.fornecedor) ?? []),
  ].filter(Boolean))]

  async function enviar(url: string, method: string, body?: object) {
    setSalvando(true)
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    setSalvando(false)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { toast(json.error || 'Erro ao salvar', 'error'); return false }
    await carregar()
    return true
  }

  function abrirNovoLote() {
    setEditandoLote(null); setFormLote({ ...LOTE_VAZIO, dataRecebimento: localDate() }); setModalLote(true)
  }
  function abrirEdicaoLote(l: Lote) {
    setEditandoLote(l.id)
    setFormLote({ produto: l.produto, tipo: l.tipo, fornecedor: l.fornecedor, dataRecebimento: l.dataRecebimento, quantidade: String(l.quantidade), custoUnitario: String(l.custoUnitario), observacao: '' })
    setModalLote(true)
  }
  async function salvarLote(e: React.FormEvent) {
    e.preventDefault()
    const ok = editandoLote
      ? await enviar(`/api/estoque/lotes/${editandoLote}`, 'PUT', formLote)
      : await enviar('/api/estoque/lotes', 'POST', formLote)
    if (ok) { toast(editandoLote ? 'Recebimento atualizado' : 'Recebimento registrado'); setModalLote(false) }
  }
  async function excluirLote(l: Lote) {
    if (!confirm(`Excluir o recebimento de ${l.quantidade} × ${l.produto}?`)) return
    if (await enviar(`/api/estoque/lotes/${l.id}`, 'DELETE')) toast('Recebimento excluído')
  }

  function abrirSaida(tipo: 'devolucao' | 'perda', loteId = '') {
    setFormSaida({ loteId, tipo, quantidade: '', data: localDate(), observacao: '' }); setModalSaida(true)
  }
  async function salvarSaida(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar('/api/estoque/movimentos', 'POST', formSaida)) {
      toast(formSaida.tipo === 'perda' ? 'Perda registrada' : 'Devolução registrada'); setModalSaida(false)
    }
  }
  async function desfazerMovimento(m: Movimento) {
    if (!confirm(`Desfazer ${TIPO_MOV[m.tipo]?.label.toLowerCase()} de ${m.quantidade} × ${m.produto}?`)) return
    if (await enviar(`/api/estoque/movimentos/${m.id}`, 'DELETE')) toast('Desfeito')
  }

  function abrirPagamento(fornecedor = '', valor = 0) {
    setFormPgto({ fornecedor, valor: valor > 0 ? valor.toFixed(2) : '', data: localDate(), observacao: '' }); setModalPgto(true)
  }
  async function salvarPagamento(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar('/api/estoque/pagamentos', 'POST', formPgto)) { toast('Pagamento registrado'); setModalPgto(false) }
  }
  async function excluirPagamento(p: Pagamento) {
    if (!confirm(`Excluir o pagamento de ${fmt(p.valor)} a ${p.fornecedor}?`)) return
    if (await enviar(`/api/estoque/pagamentos/${p.id}`, 'DELETE')) toast('Pagamento excluído')
  }

  const totalUn = data?.produtos.reduce((s, p) => s + p.saldo, 0) ?? 0
  const totalValor = data?.produtos.reduce((s, p) => s + p.valorCusto, 0) ?? 0
  const totalAPagar = data?.fornecedores.reduce((s, f) => s + Math.max(f.aPagar, 0), 0) ?? 0
  const lotesComSaldo = data?.lotes.filter(l => l.saldo > 0) ?? []
  const loteSaida = data?.lotes.find(l => l.id === formSaida.loteId)

  return (
    <div>
      <Topbar title="📦 Estoque" subtitle="Recebimentos, saldo e consignado"
        actions={<button onClick={abrirNovoLote} className="px-3 py-1.5 bg-[#7c6fff] hover:bg-[#6a5dee] rounded-lg text-sm text-white font-medium">+ Recebimento</button>} />

      {loading || !data ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#131626] border border-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-400">Em estoque</p>
              <p className="text-2xl font-bold text-white">{totalUn}<span className="text-sm text-gray-500"> un.</span></p>
            </div>
            <div className="bg-[#131626] border border-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-400">Valor a custo</p>
              <p className="text-lg font-bold text-white">{fmt(totalValor)}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 cursor-pointer" onClick={() => setAba('consignado')}>
              <p className="text-xs text-gray-400">A pagar (consignado)</p>
              <p className="text-lg font-bold text-amber-400">{fmt(totalAPagar)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {ABAS.map(([k, l]) => (
              <button key={k} onClick={() => setAba(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${aba === k ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] text-gray-400 border border-white/5'}`}>{l}</button>
            ))}
          </div>

          {/* ---------------- SALDO ---------------- */}
          {aba === 'saldo' && (
            data.produtos.length === 0 ? (
              <div className="bg-[#131626] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm text-gray-400 mb-4">Nenhum recebimento ainda. Registre o que chegou do consignado para começar o controle.</p>
                <button onClick={abrirNovoLote} className="px-4 py-2 bg-[#7c6fff] rounded-lg text-sm text-white font-medium">+ Registrar recebimento</button>
              </div>
            ) : (
              <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-gray-400">
                        <th className="px-3 py-3 text-left">Produto</th>
                        <th className="px-3 py-3 text-right">Em estoque</th>
                        <th className="px-3 py-3 text-right">Consignado</th>
                        <th className="px-3 py-3 text-right">Próprio</th>
                        <th className="px-3 py-3 text-right">Recebido</th>
                        <th className="px-3 py-3 text-right">Vendido</th>
                        <th className="px-3 py-3 text-right">Valor a custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.produtos.map(p => (
                        <tr key={p.produto} className="border-b border-white/5">
                          <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{p.produto}</td>
                          <td className={`px-3 py-2.5 text-right font-bold ${p.saldo === 0 ? 'text-red-400' : p.saldo <= 2 ? 'text-amber-400' : 'text-green-400'}`}>
                            {p.saldo}{p.saldo === 0 && <span className="ml-1 text-[10px] font-medium">ESGOTADO</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-300">{p.consignado}</td>
                          <td className="px-3 py-2.5 text-right text-gray-300">{p.proprio}</td>
                          <td className="px-3 py-2.5 text-right text-gray-400">{p.recebido}</td>
                          <td className="px-3 py-2.5 text-right text-gray-400">{p.vendido}</td>
                          <td className="px-3 py-2.5 text-right text-white whitespace-nowrap">{fmt(p.valorCusto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ---------------- CONSIGNADO ---------------- */}
          {aba === 'consignado' && (
            <div className="space-y-3">
              <div className="flex gap-2 justify-end">
                <button onClick={() => abrirSaida('devolucao')} disabled={lotesComSaldo.length === 0}
                  className="px-3 py-1.5 bg-[#131626] border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white disabled:opacity-40">↩ Devolver ao fornecedor</button>
                <button onClick={() => abrirPagamento()}
                  className="px-3 py-1.5 bg-[#131626] border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white">💸 Registrar pagamento</button>
              </div>

              {data.fornecedores.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">Nenhum consignado registrado ainda.</div>
              )}

              {data.fornecedores.map(f => (
                <div key={f.fornecedor} className="bg-[#131626] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-semibold">{f.fornecedor}</p>
                      <p className="text-xs text-gray-500">Recebido: {f.recebidoUn} un. · {fmt(f.recebidoValor)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{f.aPagar >= 0 ? 'A pagar' : 'Crédito'}</p>
                      <p className={`text-xl font-bold ${f.aPagar > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(Math.abs(f.aPagar))}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    {[
                      ['Vendido', `${f.vendidoUn} un.`, fmt(f.vendidoValor), 'text-green-400'],
                      ['Em estoque', `${f.emEstoqueUn} un.`, fmt(f.emEstoqueValor), 'text-white'],
                      ['Devolvido', `${f.devolvidoUn} un.`, fmt(f.devolvidoValor), 'text-blue-400'],
                      ['Perdas', `${f.perdidoUn} un.`, fmt(f.perdidoValor), 'text-red-400'],
                    ].map(([t, un, v, cor]) => (
                      <div key={t} className="bg-[#0d0f1a] rounded-lg p-2.5">
                        <p className="text-xs text-gray-500">{t}</p>
                        <p className={`font-semibold ${cor}`}>{un}</p>
                        <p className="text-xs text-gray-400">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-400">
                      Deve {fmt(f.vendidoValor + f.perdidoValor)} (vendido + perdas) · Pago {fmt(f.pago)}
                    </span>
                    {f.aPagar > 0 && (
                      <button onClick={() => abrirPagamento(f.fornecedor, f.aPagar)}
                        className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 shrink-0">Pagar</button>
                    )}
                  </div>
                </div>
              ))}

              {data.pagamentos.length > 0 && (
                <div className="bg-[#131626] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Pagamentos feitos</h3>
                  <div className="space-y-1.5">
                    {data.pagamentos.map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-sm border-b border-white/5 pb-1.5">
                        <div className="min-w-0">
                          <span className="text-gray-400">{formatBR(p.data)}</span>
                          <span className="text-white ml-2">{p.fornecedor}</span>
                          {p.observacao && <span className="text-gray-500 ml-2 text-xs">· {p.observacao}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-green-400 font-medium">{fmt(p.valor)}</span>
                          <button onClick={() => excluirPagamento(p)} className="text-gray-600 hover:text-red-400">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- RECEBIMENTOS ---------------- */}
          {aba === 'recebimentos' && (
            <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-gray-400">
                      <th className="px-3 py-3 text-left">Data</th>
                      <th className="px-3 py-3 text-left">Produto</th>
                      <th className="px-3 py-3 text-left">Origem</th>
                      <th className="px-3 py-3 text-right">Recebido</th>
                      <th className="px-3 py-3 text-right">Custo un.</th>
                      <th className="px-3 py-3 text-right">Vendido</th>
                      <th className="px-3 py-3 text-right">Dev./Perda</th>
                      <th className="px-3 py-3 text-right">Saldo</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lotes.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8 text-gray-500">Nenhum recebimento.</td></tr>
                    ) : data.lotes.map(l => (
                      <tr key={l.id} className="border-b border-white/5">
                        <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{formatBR(l.dataRecebimento)}</td>
                        <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{l.produto}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded ${l.tipo === 'consignado' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-gray-400'}`}>
                            {l.tipo === 'consignado' ? `Consig. · ${l.fornecedor}` : 'Próprio'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-300">{l.quantidade}</td>
                        <td className="px-3 py-2.5 text-right text-gray-300 whitespace-nowrap">{fmt(l.custoUnitario)}</td>
                        <td className="px-3 py-2.5 text-right text-green-400">{l.vendido}</td>
                        <td className="px-3 py-2.5 text-right text-gray-400">{l.devolvido} / {l.perdido}</td>
                        <td className={`px-3 py-2.5 text-right font-bold ${l.saldo > 0 ? 'text-white' : 'text-gray-600'}`}>{l.saldo}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex gap-1">
                            {l.saldo > 0 && (
                              <button onClick={() => abrirSaida('perda', l.id)} title="Registrar perda" className="p-1 text-gray-500 hover:text-red-400">⚠️</button>
                            )}
                            <button onClick={() => abrirEdicaoLote(l)} title="Editar" className="p-1 text-gray-500 hover:text-[#7c6fff]">✏️</button>
                            <button onClick={() => excluirLote(l)} title="Excluir" className="p-1 text-gray-500 hover:text-red-400">✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- MOVIMENTAÇÕES ---------------- */}
          {aba === 'movimentos' && (
            <div className="bg-[#131626] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-gray-400">
                      <th className="px-3 py-3 text-left">Data</th>
                      <th className="px-3 py-3 text-left">Tipo</th>
                      <th className="px-3 py-3 text-left">Produto</th>
                      <th className="px-3 py-3 text-right">Qtd</th>
                      <th className="px-3 py-3 text-left">Detalhe</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.movimentos.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma movimentação. As vendas registradas a partir de agora dão baixa aqui sozinhas.</td></tr>
                    ) : data.movimentos.map(m => (
                      <tr key={m.id} className="border-b border-white/5">
                        <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{formatBR(m.data)}</td>
                        <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${TIPO_MOV[m.tipo]?.cor}`}>{TIPO_MOV[m.tipo]?.label ?? m.tipo}</span></td>
                        <td className="px-3 py-2.5 text-white whitespace-nowrap">{m.produto}</td>
                        <td className="px-3 py-2.5 text-right text-white font-medium">−{m.quantidade}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {m.tipo === 'venda' ? m.cliente : m.observacao}{m.fornecedor && <span className="text-gray-600"> · {m.fornecedor}</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.tipo !== 'venda' && (
                            <button onClick={() => desfazerMovimento(m)} title="Desfazer" className="p-1 text-gray-500 hover:text-red-400">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: recebimento */}
      <Modal open={modalLote} onClose={() => setModalLote(false)} title={editandoLote ? 'Editar recebimento' : 'Registrar recebimento'}>
        <form onSubmit={salvarLote} className="space-y-3">
          <div>
            <label className={lbl}>Produto</label>
            <input list="catalogo-estoque" className={inp} value={formLote.produto} disabled={!!editandoLote} required
              onChange={e => {
                const nome = e.target.value
                const p = catalogo.find(c => c.nome === nome)
                setFormLote(f => ({ ...f, produto: nome, custoUnitario: f.custoUnitario || (p && p.custoPadrao > 0 ? String(p.custoPadrao) : '') }))
              }} />
            <datalist id="catalogo-estoque">{catalogo.map(c => <option key={c.nome} value={c.nome} />)}</datalist>
            <p className="text-[11px] text-gray-600 mt-1">Use o mesmo nome do produto nas vendas — é por ele que a baixa acontece.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Origem</label>
              <select className={inp} value={formLote.tipo} onChange={e => setFormLote(f => ({ ...f, tipo: e.target.value }))}>
                <option value="consignado">Consignado</option>
                <option value="proprio">Próprio (já pago)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Data do recebimento</label>
              <input type="date" className={inp} value={formLote.dataRecebimento} required onChange={e => setFormLote(f => ({ ...f, dataRecebimento: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Fornecedor {formLote.tipo === 'consignado' && <span className="text-amber-400">*</span>}</label>
            <input list="fornecedores-estoque" className={inp} value={formLote.fornecedor} required={formLote.tipo === 'consignado'}
              onChange={e => setFormLote(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Quem enviou" />
            <datalist id="fornecedores-estoque">{fornecedoresConhecidos.map(f => <option key={f} value={f} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Quantidade</label>
              <input type="number" min="1" step="1" className={inp} value={formLote.quantidade} required onChange={e => setFormLote(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Custo por unidade (R$)</label>
              <input type="number" min="0" step="0.01" className={inp} value={formLote.custoUnitario} required onChange={e => setFormLote(f => ({ ...f, custoUnitario: e.target.value }))} />
            </div>
          </div>
          {Number(formLote.quantidade) > 0 && Number(formLote.custoUnitario) > 0 && (
            <p className="text-xs text-gray-400">Total do recebimento: <span className="text-white font-medium">{fmt(Number(formLote.quantidade) * Number(formLote.custoUnitario))}</span></p>
          )}
          <button type="submit" disabled={salvando} className="w-full bg-[#7c6fff] hover:bg-[#6a5dee] disabled:opacity-60 text-white py-2 rounded-lg font-semibold">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </Modal>

      {/* Modal: devolução / perda */}
      <Modal open={modalSaida} onClose={() => setModalSaida(false)} title={formSaida.tipo === 'perda' ? 'Registrar perda' : 'Devolver ao fornecedor'}>
        <form onSubmit={salvarSaida} className="space-y-3">
          <div>
            <label className={lbl}>Tipo</label>
            <select className={inp} value={formSaida.tipo} onChange={e => setFormSaida(f => ({ ...f, tipo: e.target.value }))}>
              <option value="devolucao">Devolução ao fornecedor (não paga)</option>
              <option value="perda">Perda / avaria (paga ao fornecedor se for consignado)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Lote</label>
            <select className={inp} value={formSaida.loteId} required onChange={e => setFormSaida(f => ({ ...f, loteId: e.target.value }))}>
              <option value="">Escolha…</option>
              {lotesComSaldo.map(l => (
                <option key={l.id} value={l.id}>
                  {l.produto} · {formatBR(l.dataRecebimento)} · {l.tipo === 'consignado' ? l.fornecedor : 'próprio'} · saldo {l.saldo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Quantidade {loteSaida && <span className="text-gray-600">(máx. {loteSaida.saldo})</span>}</label>
              <input type="number" min="1" max={loteSaida?.saldo} step="1" className={inp} value={formSaida.quantidade} required onChange={e => setFormSaida(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Data</label>
              <input type="date" className={inp} value={formSaida.data} required onChange={e => setFormSaida(f => ({ ...f, data: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <input className={inp} value={formSaida.observacao} onChange={e => setFormSaida(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional" />
          </div>
          <button type="submit" disabled={salvando} className="w-full bg-[#7c6fff] hover:bg-[#6a5dee] disabled:opacity-60 text-white py-2 rounded-lg font-semibold">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </Modal>

      {/* Modal: pagamento */}
      <Modal open={modalPgto} onClose={() => setModalPgto(false)} title="Registrar pagamento ao fornecedor">
        <form onSubmit={salvarPagamento} className="space-y-3">
          <div>
            <label className={lbl}>Fornecedor</label>
            <input list="fornecedores-pgto" className={inp} value={formPgto.fornecedor} required onChange={e => setFormPgto(f => ({ ...f, fornecedor: e.target.value }))} />
            <datalist id="fornecedores-pgto">{fornecedoresConhecidos.map(f => <option key={f} value={f} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" className={inp} value={formPgto.valor} required onChange={e => setFormPgto(f => ({ ...f, valor: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Data</label>
              <input type="date" className={inp} value={formPgto.data} required onChange={e => setFormPgto(f => ({ ...f, data: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <input className={inp} value={formPgto.observacao} onChange={e => setFormPgto(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex.: Pix, acerto de outubro" />
          </div>
          <button type="submit" disabled={salvando} className="w-full bg-[#7c6fff] hover:bg-[#6a5dee] disabled:opacity-60 text-white py-2 rounded-lg font-semibold">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
