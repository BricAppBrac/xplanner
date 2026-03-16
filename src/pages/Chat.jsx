import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../lib/claude'

export default function Chat({ profile, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bonjour ${profile.prenom} ! 🌱 Ton potager à ${profile.ville} me manquait. Qu'est-ce qu'on fait aujourd'hui ?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    const reply = await sendMessage(newMessages, profile, [])
    setMessages([...newMessages, { role: 'assistant', content: reply }])
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,20,10,0.98)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Georgia, serif'
    }}>
      {/* Header chat */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(109,191,109,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/src/img/ElfynNeutre1024_transp.png" alt="Elfyn" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#e8f5e8', fontSize: 16, fontWeight: 'bold' }}>Elfyn</div>
          <div style={{ color: '#6dbf6d', fontSize: 12 }}>Ton compagnon de jardin</div>
        </div>
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#a8d5a2', fontSize: 22, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {msg.role === 'assistant' && (
              <img src="/src/img/ElfynNeutre1024_transp.png" alt="Elfyn" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
            )}
            <div style={{
              maxWidth: '80%', padding: '12px 16px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #2d5a2d, #3a6e3a)' : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user' ? '1px solid rgba(109,191,109,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              color: '#e8f5e8', fontSize: 14, lineHeight: 1.6
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <img src="/src/img/ElfynIdee1024_transp.png" alt="Elfyn" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(d => (
                  <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6dbf6d', opacity: 0.6, animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(109,191,109,0.15)', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Écris à Elfyn..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(109,191,109,0.25)',
            borderRadius: 20, padding: '10px 16px',
            color: '#e8f5e8', fontSize: 14, fontFamily: 'Georgia, serif', outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'linear-gradient(135deg, #4a7c4a, #6dbf6d)' : 'rgba(109,191,109,0.2)',
            border: 'none', borderRadius: 20, padding: '10px 18px',
            color: '#fff', fontSize: 18, cursor: input.trim() && !loading ? 'pointer' : 'default'
          }}
        >→</button>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  )
}