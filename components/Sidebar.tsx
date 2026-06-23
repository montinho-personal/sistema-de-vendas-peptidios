'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/app/hoje', icon: '⚡', label: 'Hoje' },
  { href: '/app/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/app/intel', icon: '🧠', label: 'Inteligência' },
  { href: '/app/nova-venda', icon: '➕', label: 'Nova Venda' },
  { href: '/app/vendas', icon: '📋', label: 'Todas as Vendas' },
  { href: '/app/vendas-perdidas', icon: '⚠️', label: 'Vendas Perdidas' },
  { href: '/app/recompra', icon: '🔔', label: 'Recompra' },
  { href: '/app/clientes', icon: '👥', label: 'Score Clientes' },
  { href: '/app/cadastro-clientes', icon: '👤', label: 'Cadastro Clientes' },
  { href: '/app/indicacoes', icon: '🔗', label: 'Indicações' },
  { href: '/app/produtos', icon: '📦', label: 'Análise Produtos' },
  { href: '/app/cadastro-produtos', icon: '🏷️', label: 'Cadastro Produtos' },
  { href: '/app/margens', icon: '💰', label: 'Margens' },
  { href: '/app/previsao', icon: '🔮', label: 'Previsão' },
  { href: '/app/metas', icon: '🎯', label: 'Metas' },
  { href: '/app/consultor', icon: '🤖', label: 'Consultor IA' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c6fff]/20 flex items-center justify-center text-sm">⚡</div>
          <span className="font-bold text-sm text-white">VendaControl Pro</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#7c6fff]/20 text-[#7c6fff] font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-[#131626] border border-white/10 rounded-lg flex items-center justify-center text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#131626] border-r border-white/5 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#131626] border-r border-white/5 shrink-0">
        {content}
      </aside>
    </>
  )
}
