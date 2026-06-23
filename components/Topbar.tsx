'use client'

import { useRouter } from 'next/navigation'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={() => router.back()}
        className="hidden lg:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0"
      >
        ← Voltar
      </button>
      <div className="flex-1 min-w-0 lg:pl-0 pl-12">
        <h1 className="text-xl font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
