import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Jardin from './pages/Jardin'
import Agenda from './pages/Agenda'
import Chat from './pages/Chat'
import Decouvrir from './pages/Decouvrir'
import Calendrier from './pages/Calendrier'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('jardin')
  const [chatOuvert, setChatOuvert] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [legumesRef, setLegumesRef] = useState([])
  const [cultures, setCultures] = useState([])

  useEffect(() => {
  let mounted = true

  // Charger la session au montage
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!mounted) return
    if (session) {
      setSession(session)
      checkProfile(session.user.id)
    } else {
      setLoading(false)
    }
  })

  // Écouter uniquement sign-in / sign-out réels
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return
    if (event === 'SIGNED_OUT') {
      setSession(null)
      setProfile(null)
      setIsNewUser(false)
      setLoading(false)
    } else if (event === 'SIGNED_IN') {
      setSession(session)
      checkProfile(session.user.id)
    }
    // TOKEN_REFRESHED et autres events : on ignore, pas de spinner
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
    setLoading(false)  // loading passe à false UNE SEULE FOIS ici
  }

  // Tant que loading = true, on affiche juste le spinner — jamais l'onboarding ni le dashboard
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
      <img
        src="/src/img/ElfynNeutre1024_transp.png"
        alt="Elfyn"
        style={{ width: 140, height: 140, objectFit: 'contain', display: 'block', margin: '0 auto' }}
      />
      <h1 style={{ color: '#e8f5e8', margin: '16px 0 8px', fontSize: 26 }}>
        Bonjour {profile.prenom} !
      </h1>
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
          <img
            src="/src/img/ElfynNeutre1024_transp.png"
            alt="Elfyn"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
          />
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
          { id: 'jardin', label: '🌿 Jardin' },
          { id: 'decouvrir', label: '🔍 Découvrir' },
          { id: 'agenda', label: '📅 Agenda' },
          { id: 'calendrier', label: '📆 Calendrier' },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              flex: 1, padding: '14px', border: 'none', background: 'transparent',
              color: onglet === o.id ? '#6dbf6d' : '#a8d5a2',
              fontSize: 16, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
              borderBottom: onglet === o.id ? '2px solid #6dbf6d' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {onglet === 'jardin' && <Jardin profile={profile} session={session} />}
        {onglet === 'decouvrir' && <Decouvrir profile={profile} legumesRef={legumesRef} />}
        {onglet === 'agenda' && <Agenda profile={profile} cultures={cultures} legumesRef={legumesRef} />}
        {onglet === 'calendrier' && <Calendrier profile={profile} legumesRef={legumesRef} />}
      </div>

      {/* Barre chat fixe en bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,20,10,0.95)', borderTop: '1px solid rgba(109,191,109,0.2)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <img src="/src/img/ElfynIdee1024_transp.png" alt="Elfyn" style={{ width: 50, height: 50, objectFit: 'contain', flexShrink: 0 }} />
        <div
          onClick={() => setChatOuvert(true)}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(109,191,109,0.25)',
            borderRadius: 20, padding: '10px 16px',
            color: '#6dbf6d', fontSize: 16, cursor: 'pointer'
          }}
        >
          Elfyn · Conseils du jour
        </div>
      </div>

      {/* Chat overlay */}
      {chatOuvert && (
        <Chat profile={profile} onClose={() => setChatOuvert(false)} />
      )}
    </div>
  )
}