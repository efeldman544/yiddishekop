'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  savedMemory?: boolean
}

type Memory = {
  id: string
  lesson: string
  category: string
  created_at: string
}

const SESSION_START_MESSAGE = `SESSION START — run the protocol:
1. What is the 1H dominant trend and EMA slope?
2. Key swing highs/lows and major S/R levels?
3. Where is price on the 5-min relative to EMA and overnight structure?
4. Session bias: bullish, bearish, or neutral/wait?
5. Key levels for today: prior day high/low, round numbers, overnight high/low.
6. What setup types are we watching for?`

export default function CopilotChat({ initialMemories }: { initialMemories: Memory[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [memories, setMemories] = useState<Memory[]>(initialMemories)
  const [showMemories, setShowMemories] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: content.trim() }
    const assistantId = crypto.randomUUID()

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            if (event.type === 'text') {
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: m.content + event.text } : m)
              )
            } else if (event.type === 'memory_saved') {
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, savedMemory: true } : m)
              )
              // Refresh memories from server
              fetch('/api/copilot/memory')
                .then(r => r.json())
                .then(setMemories)
                .catch(() => {})
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Request failed'}` }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const deleteMemory = async (id: string) => {
    await fetch('/api/copilot/memory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex h-screen bg-[#0d0f11] text-[#e2e8f0] font-mono">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#1e2530] flex flex-col">
        <div className="p-4 border-b border-[#1e2530]">
          <div className="text-xs text-[#4a9eff] font-bold tracking-widest uppercase mb-1">Trading Co-Pilot</div>
          <div className="text-[10px] text-[#4b5563]">MNQU26 · TopstepX 50K</div>
        </div>

        <div className="p-3 border-b border-[#1e2530] space-y-2">
          <button
            onClick={() => sendMessage(SESSION_START_MESSAGE)}
            disabled={isStreaming}
            className="w-full text-left px-3 py-2 rounded text-xs bg-[#1a2236] hover:bg-[#1e2d47] text-[#4a9eff] border border-[#1e3a5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶ Session Start Protocol
          </button>
          <button
            onClick={clearChat}
            disabled={isStreaming}
            className="w-full text-left px-3 py-2 rounded text-xs bg-[#1a1a1a] hover:bg-[#222] text-[#6b7280] border border-[#2a2a2a] transition-colors disabled:opacity-40"
          >
            ✕ Clear Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <button
            onClick={() => setShowMemories(!showMemories)}
            className="w-full text-left text-[10px] text-[#4b5563] hover:text-[#9ca3af] uppercase tracking-wider mb-2 flex items-center justify-between"
          >
            <span>Memory Bank ({memories.length})</span>
            <span>{showMemories ? '▲' : '▼'}</span>
          </button>

          {showMemories && (
            <div className="space-y-1">
              {memories.length === 0 && (
                <div className="text-[10px] text-[#374151] italic px-1">
                  No memories yet. Type "remember: [lesson]" to save one.
                </div>
              )}
              {memories.map(m => (
                <div key={m.id} className="group relative text-[10px] text-[#6b7280] bg-[#111318] rounded px-2 py-1.5 border border-[#1e2530]">
                  <div className="pr-4 leading-relaxed">{m.lesson}</div>
                  <div className="text-[#2d3748] mt-0.5">
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="absolute top-1 right-1 text-[#374151] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#1e2530]">
          <div className="text-[10px] text-[#2d3748]">
            Type <span className="text-[#374151]">remember: [lesson]</span> to teach the co-pilot
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-[#2d3748] space-y-3">
                <div className="text-4xl">📊</div>
                <div className="text-sm">Co-pilot standing by.</div>
                <div className="text-xs">Click <span className="text-[#4a9eff]">Session Start Protocol</span> to begin,<br />or describe what you're seeing on the chart.</div>
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1a2236] border border-[#1e3a5f] text-[#93c5fd]'
                    : 'bg-[#111318] border border-[#1e2530] text-[#e2e8f0]'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="text-[10px] text-[#374151] mb-1.5 uppercase tracking-wider">Co-Pilot</div>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.savedMemory && (
                  <div className="mt-2 text-[10px] text-[#10b981] border-t border-[#064e3b] pt-1.5">
                    ✓ Lesson saved to memory bank
                  </div>
                )}
                {m.role === 'assistant' && !m.content && isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-[#4a9eff] animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#1e2530] p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the chart… or 'remember: [lesson]' to teach the co-pilot"
              disabled={isStreaming}
              rows={2}
              className="flex-1 bg-[#111318] border border-[#1e2530] rounded-lg px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#374151] resize-none focus:outline-none focus:border-[#1e3a5f] disabled:opacity-50 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              className="px-4 py-3 bg-[#1a2236] hover:bg-[#1e2d47] border border-[#1e3a5f] rounded-lg text-[#4a9eff] text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isStreaming ? '…' : 'Send'}
            </button>
          </div>
          <div className="text-[10px] text-[#2d3748] mt-2">Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  )
}
