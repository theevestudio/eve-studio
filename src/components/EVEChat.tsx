'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

type Message = { role: 'user' | 'assistant'; content: string }

function renderMessage(content: string) {
  const lines = content.split('\n').filter(l => l.trim() !== '')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const numbered = line.match(/^(\d+)\.\s+(.+)/)
        const bullet = line.match(/^[-•]\s+(.+)/)
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 font-bold shrink-0">{numbered[1]}.</span>
              <span>{numbered[2]}</span>
            </div>
          )
        }
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 shrink-0">•</span>
              <span>{bullet[1]}</span>
            </div>
          )
        }
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export default function EVEChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey, I'm E.V.E. What do you need?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryPayload, setRetryPayload] = useState<Message[] | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setRetryPayload(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
      setRetryPayload(newMessages)
    } finally {
      setLoading(false)
    }
  }

  async function retry() {
    if (!retryPayload) return
    const payload = retryPayload
    setRetryPayload(null)
    setMessages(prev => prev.slice(0, -1))
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
      setRetryPayload(payload)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 left-4 z-50 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '500px' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <Image src="/logo-icon.png" alt="E.V.E." width={28} height={28} className="rounded-full" />
            <div>
              <p className="text-sm font-bold">E.V.E.</p>
              <p className="text-xs text-zinc-500">AI Assistant · always here to help</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-zinc-600 hover:text-white transition text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {retryPayload && !loading && (
              <div className="flex justify-start">
                <button
                  onClick={retry}
                  className="text-xs text-violet-400 hover:text-violet-300 transition border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-xl"
                >
                  ↺ Retry
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-zinc-800 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask E.V.E. anything..."
              disabled={loading}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 transition placeholder-zinc-600 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition text-white rounded-xl px-3 py-2 text-sm font-bold"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Toggle button — fixed bottom-left */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 left-4 z-50 w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 hover:border-violet-500 transition shadow-lg flex items-center justify-center overflow-hidden"
        title="Ask E.V.E."
      >
        <Image
          src="/logo-icon.png"
          alt="Ask E.V.E."
          width={80}
          height={80}
          className={`transition-all duration-300 ${open ? 'opacity-50' : 'opacity-100'}`}
        />
      </button>
    </>
  )
}
