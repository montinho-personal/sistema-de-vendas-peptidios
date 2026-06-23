'use client'

import { useState, useRef, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Quais clientes estão em risco de churn?',
  'Qual produto tem maior potencial de crescimento?',
  'Como posso aumentar minha margem média?',
  'Quais clientes devo priorizar esta semana?',
  'Quais produtos estão em declínio?',
  'Como está minha taxa de retenção de clientes?',
]

export default function ConsultorPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, streaming])

  async function send(text?: string) {
    const userMsg = text || input.trim()
    if (!userMsg || streaming) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', content: userMsg }]
    setMsgs(newMsgs)
    setStreaming(true)

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMsgs }),
    })

    if (!res.body) { setStreaming(false); return }

    let assistant = ''
    setMsgs(m => [...m, { role: 'assistant', content: '' }])
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistant += dec.decode(value)
      setMsgs(m => [...m.slice(0, -1), { role: 'assistant', content: assistant }])
    }
    setStreaming(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <Topbar title="🤖 Consultor IA" subtitle="Pergunte sobre seu negócio" />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {msgs.length === 0 && (
          <div className="py-8">
            <p className="text-center text-gray-500 mb-6 text-sm">Olá! Sou seu consultor de inteligência comercial. Pergunte qualquer coisa sobre seus dados de vendas.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {SUGESTOES.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left bg-[#131626] border border-white/5 hover:border-[#7c6fff]/40 rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-[#7c6fff] text-white' : 'bg-[#131626] border border-white/5 text-gray-200'
            }`}>
              {m.content}
              {streaming && i === msgs.length - 1 && m.role === 'assistant' && (
                <span className="inline-block w-2 h-4 bg-[#7c6fff] animate-pulse ml-1 align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-[#131626] border border-white/10 rounded-2xl p-3 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pergunte sobre vendas, clientes, produtos, margens..."
          rows={2}
          className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none"
        />
        <button onClick={() => send()} disabled={streaming || !input.trim()}
          className="px-4 py-2 bg-[#7c6fff] text-white rounded-xl font-medium text-sm disabled:opacity-50 self-end">
          {streaming ? '...' : '↑'}
        </button>
      </div>
    </div>
  )
}
