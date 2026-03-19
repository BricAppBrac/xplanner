import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { getNow, toLocalDateStr } from './lib/dateTest'
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
  const [elfynAlerteDismissed, setElfynAlerteDismissed] = useState(false)
  const [elfynConfirmId, setElfynConfirmId] = useState(null)
  const [elfynDate, setElfynDate] = useState('')
  const [elfynSaving, setElfynSaving] = useState(false)

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

  const PROGRESSIONS = {
    'A': ['a_semer', 'seme_abri_plateau', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
    'B': ['a_semer', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
    'C': ['a_semer', 'seme_place', 'recolte', 'termine'],
    'D': ['a_planter', 'plante', 'recolte', 'termine'],
  }
  const STATUTS_SEMIS = ['seme_abri_plateau', 'seme_abri_godet', 'seme_place']

  const culturesEnRetard = useMemo(() => {
    const now = getNow(); now.setHours(0, 0, 0, 0)
    return cultures.filter(c =>
      (c.statut === 'a_semer' || c.statut === 'a_planter') &&
      c.date_semis && c.date_semis !== '1970-01-01' &&
      c.itineraire &&
      new Date(c.date_semis) <= now
    )
  }, [cultures])

  const elfynAlerteCulture = !elfynAlerteDismissed && culturesEnRetard.length > 0 ? culturesEnRetard[0] : null

  const getStatutSuivant = (culture) => {
    const progression = PROGRESSIONS[culture.itineraire]
    if (!progression) return null
    const idx = progression.indexOf(culture.statut)
    if (idx === -1 || idx >= progression.length - 1) return null
    return progression[idx + 1]
  }

  const confirmerElfyn = async () => {
    const c = elfynAlerteCulture
    if (!c) return
    const suivant = getStatutSuivant(c)
    if (!suivant) return
    setElfynSaving(true)
    const dateChoisie = elfynDate || c.date_semis
    const updates = { statut: suivant }
    if (STATUTS_SEMIS.includes(suivant)) updates.date_semis = dateChoisie
    if (suivant === 'plante') {
      updates.date_plantation = dateChoisie
      const ref = legumesRef.find(l => l.id === c.legume_ref_id)
      if (ref?.duree_avant_recolte_jours) {
        const [y, m, d] = dateChoisie.split('-').map(Number)
        const dateRec = new Date(y, m - 1, d + ref.duree_avant_recolte_jours)
        updates.date_recolte_prevue = toLocalDateStr(dateRec)
      }
    }
    await supabase.from('cultures').update(updates).eq('id', c.id)

    // Recalculer les dates des semis suivants du même groupe
    if (c.groupe_id && c.numero_semis === 1 && c.total_semis > 1) {
      const freres = cultures
        .filter(x => x.groupe_id === c.groupe_id && x.numero_semis > 1)
        .sort((a, b) => a.numero_semis - b.numero_semis)
      if (freres.length > 0) {
        // Déduire l'intervalle en jours depuis l'écart existant entre semis 1 et 2
        const semis2 = freres[0]
        const parseLocal = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
        const ancienneDate1 = parseLocal(c.date_semis)
        const ancienneDate2 = parseLocal(semis2.date_semis)
        const intervalleJours = Math.round((ancienneDate2 - ancienneDate1) / (1000 * 60 * 60 * 24))
        if (intervalleJours > 0) {
          const dateBase = parseLocal(dateChoisie)
          for (const frere of freres) {
            const nouvDate = new Date(dateBase)
            nouvDate.setDate(nouvDate.getDate() + (frere.numero_semis - 1) * intervalleJours)
            await supabase.from('cultures').update({ date_semis: toLocalDateStr(nouvDate) }).eq('id', frere.id)
          }
        }
      }
    }

    setElfynSaving(false)
    setElfynConfirmId(null)
    reloadCultures()
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
      {!elfynOuvert && !elfynAlerteCulture && (
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

      {/* Elfyn — alerte cultures en retard */}
      {elfynAlerteCulture && (() => {
        const c = elfynAlerteCulture
        const datePrevue = new Date(c.date_semis).toLocaleDateString('fr-FR')
        return (
          <div style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            display: 'flex', alignItems: 'flex-end', gap: 8,
          }}>
            <img
              key={bounceKey}
              src="/src/img/ElfynAlerte1024_transp.png"
              alt="Elfyn"
              style={{
                width: 48, height: 48, objectFit: 'contain', flexShrink: 0,
                animation: 'elfyn-bounce 0.6s ease-in-out',
              }}
            />
            <div style={{
              background: 'rgba(10,20,10,0.95)',
              border: '1px solid rgba(240,165,0,0.4)',
              borderRadius: '18px 18px 18px 4px',
              padding: '14px 18px', maxWidth: 320,
              fontFamily: 'Amaranth, sans-serif',
            }}>
              {elfynConfirmId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#e8f5e8', fontSize: 13 }}>Date réelle :</div>
                  <input
                    type="date"
                    value={elfynDate}
                    onChange={e => setElfynDate(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(109,191,109,0.3)',
                      borderRadius: 8, padding: '6px 10px', color: '#e8f5e8', fontSize: 14,
                      fontFamily: 'Amaranth, sans-serif',
                    }}
                  />
                  <button
                    disabled={elfynSaving}
                    onClick={confirmerElfyn}
                    style={{
                      padding: '8px 16px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                      border: 'none', borderRadius: 10, color: '#fff', fontSize: 14,
                      cursor: elfynSaving ? 'not-allowed' : 'pointer', fontFamily: 'Amaranth, sans-serif',
                    }}
                  >{elfynSaving ? '...' : 'Confirmer'}</button>
                </div>
              ) : (
                <>
                  <div style={{ color: '#e8f5e8', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
                    Tu avais prévu de semer ta culture de <strong style={{ color: '#6dbf6d' }}>{c.legume}</strong> le <strong style={{ color: '#f0a500' }}>{datePrevue}</strong>, c'est fait ?
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setElfynConfirmId(c.id); setElfynDate(c.date_semis) }}
                      style={{
                        flex: 1, padding: '8px 14px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                        border: 'none', borderRadius: 10, color: '#fff', fontSize: 14,
                        cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                      }}
                    >Oui ✓</button>
                    <button
                      onClick={() => setElfynAlerteDismissed(true)}
                      style={{
                        flex: 1, padding: '8px 14px', background: 'transparent',
                        border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
                        color: '#a8d5a2', fontSize: 14, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                      }}
                    >Pas encore</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

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
