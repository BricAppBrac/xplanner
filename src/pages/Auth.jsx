import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else if (!isLogin) {
      setMessage('Vérifie ton email pour confirmer ton compte !')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{
        background: 'rgba(10,20,10,0.7)',
        border: '1px solid rgba(109,191,109,0.2)',
        borderRadius: 16, padding: 40, width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
          src="/src/img/ElfynNeutre1024_transp.png"
          alt="Elfyn"
          style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
          <h1 style={{ color: '#e8f5e8', fontSize: 24, margin: '8px 0 4px' }}>Plan Potager</h1>
          <p style={{ color: '#6dbf6d', fontSize: 13, margin: 0 }}>
            {isLogin ? 'Connecte-toi à ton jardin' : 'Crée ton compte'}
          </p>
        </div>

        <input
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%', marginBottom: 12, padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(109,191,109,0.25)',
            borderRadius: 10, color: '#e8f5e8', fontSize: 14,
            fontFamily: 'Georgia, serif', boxSizing: 'border-box', outline: 'none'
          }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', marginBottom: 20, padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(109,191,109,0.25)',
            borderRadius: 10, color: '#e8f5e8', fontSize: 14,
            fontFamily: 'Georgia, serif', boxSizing: 'border-box', outline: 'none'
          }}
        />

        {message && (
          <p style={{ color: '#6dbf6d', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {message}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
            border: 'none', borderRadius: 10, color: '#fff',
            fontSize: 15, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'Georgia, serif', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p
          onClick={() => { setIsLogin(!isLogin); setMessage('') }}
          style={{
            textAlign: 'center', color: '#a8d5a2', fontSize: 13,
            marginTop: 20, cursor: 'pointer'
          }}
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </p>
      </div>
    </div>
  )
}