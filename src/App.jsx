import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Jardin from './pages/Jardin'
import Agenda from './pages/Agenda'
import Fiches from './pages/Fiches'
import Calendrier from './pages/Calendrier'
import CetteSemaine from './pages/CetteSemaine'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('jardin')
  const [elfynOuvert, setElfynOuvert] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [legumesRef, setLegumesRef] = useState([])
  const [cultures, setCultures] = useState([])
  const [bounceKey, setBounceKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setBounceKey(k => k + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
  let mounted = true

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!mounted) return
    if (session) {
      setSession(session)
      checkProfile(session.user.id)
    } else {
      setLoading(false)
    }
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return
    if (event === 'SIGNED_OUT') {
      setSession(null)
      setProfile(null)
      setIsNewUser(false)
      setLoading(false)
    } else if (event === 'SIGNED_IN') {
      setSession(session)
      setLoading(true)
      checkProfile(session.user.id)
    }
  })
  return () => { mounted = false; subscription.unsubscribe() }
}, [])

  const checkProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data || null)
    const [{ data: legRef }, { data: cult }] = await Promise.all([
      supabase.from('legumes_ref').select('*').order('nom'),
      supabase.from('cultures').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    setLegumesRef(legRef || [])
    setCultures(cult || [])
    setLoading(false)
  }

  const reloadCultures = async () => {
    if (!session) return
    const { data } = await supabase
      .from('cultures')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setCultures(data || [])
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a2e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
      🌱
    </div>
  )

  if (!session) return <Auth />
  if (!profile) return (
  <Onboarding onComplete={() => {
    setIsNewUser(true)
    checkProfile(session.user.id)
  }} />
)

if (isNewUser) return (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Amaranth, sans-serif' }}>
    <div style={{ textAlign: 'center' }}>
      <img src="/src/img/ElfynNeutre1024_transp.png" alt="Elfyn" style={{ width: 140, height: 140, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
      <h1 style={{ color: '#e8f5e8', margin: '16px 0 8px', fontSize: 26 }}>Bonjour {profile.prenom} !</h1>
      <p style={{ color: '#6dbf6d', fontSize: 17, margin: '0 0 32px' }}>
        Je suis Elfyn, ton compagnon de jardin 🌱<br/>
        Ton potager à {profile.ville} n'attend plus que toi.
      </p>
      <button
        onClick={() => setIsNewUser(false)}
        style={{
          padding: '13px 32px',
          background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 17,
          cursor: 'pointer', fontFamily: 'Amaranth, sans-serif'
        }}
      >
        Découvrir mon jardin 🌿
      </button>
    </div>
  </div>
)

  return (
    <div style={{ minHeight: '100vh', background: '#1a2e1a', display: 'flex', flexDirection: 'column', fontFamily: 'Amaranth, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(10,20,10,0.8)', borderBottom: '1px solid rgba(109,191,109,0.15)', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/src/img/ElfynNeutre1024_transp.png" alt="Elfyn" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <span style={{ color: '#e8f5e8', fontSize: 22, fontWeight: 'bold' }}>Plan Potager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#6dbf6d', fontSize: 15 }}>{profile.prenom} · {profile.ville}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(109,191,109,0.3)',
              borderRadius: 8, padding: '4px 10px',
              color: '#a8d5a2', fontSize: 11,
              cursor: 'pointer', fontFamily: 'Amaranth, sans-serif'
            }}
          >
            ⎋ Quitter
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(109,191,109,0.15)', background: 'rgba(10,20,10,0.5)' }}>
        {[
          { id: 'jardin', label: '🌿 Mon Jardin' },
          { id: 'agenda', label: '🗓️ Agenda' },
          { id: 'fiches', label: '📋 Fiches' },
          { id: 'calendrier', label: '📆 Calendrier' },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              flex: 1, padding: '12px 4px', border: 'none', background: 'transparent',
              color: onglet === o.id ? '#6dbf6d' : '#a8d5a2',
              fontSize: 14, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
              borderBottom: onglet === o.id ? '2px solid #6dbf6d' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {onglet === 'jardin' && <Jardin profile={profile} session={session} cultures={cultures} legumesRef={legumesRef} onCultureChanged={reloadCultures} />}
        {onglet === 'agenda' && <Agenda profile={profile} session={session} cultures={cultures} legumesRef={legumesRef} onCultureChanged={reloadCultures} />}
        {onglet === 'fiches' && <Fiches legumesRef={legumesRef} profile={profile} />}
        {onglet === 'calendrier' && <Calendrier profile={profile} legumesRef={legumesRef} />}
      </div>

      {/* Elfyn bulle */}
      <style>{`
        @keyframes elfyn-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      {!elfynOuvert && (
        <div
          onClick={() => setElfynOuvert(true)}
          style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            display: 'flex', alignItems: 'flex-end', gap: 8,
            cursor: 'pointer',
          }}
        >
          <img
            key={bounceKey}
            src="/src/img/ElfynIdee1024_transp.png"
            alt="Elfyn"
            style={{
              width: 48, height: 48, objectFit: 'contain', flexShrink: 0,
              animation: 'elfyn-bounce 0.6s ease-in-out',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
          <div style={{
            background: 'rgba(10,20,10,0.95)',
            border: '1px solid rgba(109,191,109,0.4)',
            borderRadius: '18px 18px 18px 4px',
            padding: '10px 16px',
            color: '#6dbf6d', fontSize: 13,
            fontFamily: 'Amaranth, sans-serif',
            whiteSpace: 'nowrap',
          }}>
            Veux-tu connaître les semis et plantations possibles cette semaine ?
          </div>
        </div>
      )}

      {/* Modale Elfyn — Cette semaine */}
      {elfynOuvert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,20,10,0.98)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Amaranth, sans-serif',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(109,191,109,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/src/img/ElfynIdee1024_transp.png" alt="Elfyn" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div style={{ color: '#e8f5e8', fontSize: 20, fontWeight: 'bold', flex: 1 }}>Cette semaine au jardin</div>
            <button
              onClick={() => setElfynOuvert(false)}
              style={{ background: 'transparent', border: 'none', color: '#a8d5a2', fontSize: 22, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CetteSemaine profile={profile} legumesRef={legumesRef} />
          </div>
        </div>
      )}
    </div>
  )
}
