import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ETAPES = ['prenom', 'ville', 'surface', 'niveau']

const NIVEAUX = [
  { value: 'debutant', label: 'Débutant', desc: 'Je débute ou je galère encore' },
  { value: 'intermediaire', label: 'Intermédiaire', desc: 'Je jardine mais je rate des choses' },
  { value: 'experimente', label: 'Expérimenté', desc: 'Je maîtrise, je veux optimiser' },
]

// 3 états de la mascotte
const MASCOTTE = {
  content: '/src/img/ElfynNeutre1024_transp.png',
  idee: '/src/img/ElfynIdee1024_transp.png',
  alerte: '/src/img/ElfynAlerte1024_transp.png',
}

export default function Onboarding({ onComplete }) {
  const [etape, setEtape] = useState(0)
  const [form, setForm] = useState({
    prenom: '', ville: '', surface_m2: '', niveau: ''
  })
  const [loading, setLoading] = useState(false)

  const etapeActuelle = ETAPES[etape]
  const progression = ((etape) / ETAPES.length) * 100

  const handleNext = () => {
    if (etape < ETAPES.length - 1) setEtape(etape + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      prenom: form.prenom,
      ville: form.ville,
      surface_m2: parseInt(form.surface_m2) || null,
      niveau: form.niveau,
      equipements: [],
    })

    if (!error) onComplete()
    setLoading(false)
  }

  const canNext = () => {
    if (etapeActuelle === 'prenom') return form.prenom.trim().length > 0
    if (etapeActuelle === 'ville') return form.ville.trim().length > 0
    if (etapeActuelle === 'surface') return true // optionnel
    if (etapeActuelle === 'niveau') return form.niveau !== ''
    return false
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Barre de progression */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6dbf6d', fontSize: 12, marginBottom: 8, fontFamily: 'sans-serif' }}>
            <span>Plan Potager</span>
            <span>{etape + 1} / {ETAPES.length}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(109,191,109,0.2)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${progression}%`, background: 'linear-gradient(90deg, #4a7c4a, #6dbf6d)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Carte principale */}
        <div style={{
          background: 'rgba(10,20,10,0.7)',
          border: '1px solid rgba(109,191,109,0.2)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>

          {/* Mascotte */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 56 }}>
              {etapeActuelle === 'prenom' ? '🌱' :
               etapeActuelle === 'ville' ? '📍' :
               etapeActuelle === 'surface' ? '💡' : '⭐'}
            </div>
          </div>

          {/* Étape 1 — Prénom */}
          {etapeActuelle === 'prenom' && (
            <div>
              <h2 style={{ color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
                Bonjour ! Je suis Elfyn, l'Esprit de ton Jardin 🌿
              </h2>
              <p style={{ color: '#a8d5a2', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>
                Pour qu'on fasse connaissance, comment tu t'appelles ?
              </p>
              <input
                autoFocus
                placeholder="Ton prénom"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                style={inputStyle}
              />
            </div>
          )}

          {/* Étape 2 — Ville */}
          {etapeActuelle === 'ville' && (
            <div>
              <h2 style={{ color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
                Enchanté {form.prenom} ! 👋
              </h2>
              <p style={{ color: '#a8d5a2', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>
                Dans quelle ville est ton potager ? Je dois connaître ton climat pour te donner les bons conseils.
              </p>
              <input
                autoFocus
                placeholder="Ex : Lyon, Bordeaux, Rennes..."
                value={form.ville}
                onChange={e => setForm({ ...form, ville: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                style={inputStyle}
              />
            </div>
          )}

          {/* Étape 3 — Surface */}
          {etapeActuelle === 'surface' && (
            <div>
              <h2 style={{ color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
                {form.ville}, beau coin ! 🗺️
              </h2>
              <p style={{ color: '#a8d5a2', fontSize: 14, textAlign: 'center', margin: '0 0 28px' }}>
                Quelle est la surface de ton potager ? (optionnel)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  autoFocus
                  type="number"
                  placeholder="Ex : 20"
                  value={form.surface_m2}
                  onChange={e => setForm({ ...form, surface_m2: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ color: '#6dbf6d', fontSize: 16, whiteSpace: 'nowrap' }}>m²</span>
              </div>
            </div>
          )}

          {/* Étape 4 — Niveau */}
          {etapeActuelle === 'niveau' && (
            <div>
              <h2 style={{ color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
                Dernière question !
              </h2>
              <p style={{ color: '#a8d5a2', fontSize: 14, textAlign: 'center', margin: '0 0 24px' }}>
                Comment tu te situes en jardinage ?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {NIVEAUX.map(n => (
                  <div
                    key={n.value}
                    onClick={() => setForm({ ...form, niveau: n.value })}
                    style={{
                      padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                      border: form.niveau === n.value
                        ? '1px solid #6dbf6d'
                        : '1px solid rgba(109,191,109,0.2)',
                      background: form.niveau === n.value
                        ? 'rgba(109,191,109,0.15)'
                        : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ color: '#e8f5e8', fontSize: 15 }}>{n.label}</div>
                    <div style={{ color: '#6dbf6d', fontSize: 12, marginTop: 2, fontFamily: 'sans-serif' }}>{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={etape < ETAPES.length - 1 ? handleNext : handleSubmit}
            disabled={!canNext() || loading}
            style={{
              width: '100%', marginTop: 28, padding: '13px',
              background: canNext() && !loading
                ? 'linear-gradient(135deg, #4a7c4a, #6dbf6d)'
                : 'rgba(109,191,109,0.2)',
              border: 'none', borderRadius: 12,
              color: canNext() ? '#fff' : '#6dbf6d',
              fontSize: 15, cursor: canNext() && !loading ? 'pointer' : 'default',
              fontFamily: 'Georgia, serif', transition: 'all 0.3s'
            }}
          >
            {loading ? '...' :
             etape < ETAPES.length - 1 ? 'Continuer →' : 'Démarrer mon potager 🌱'}
          </button>

        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(109,191,109,0.25)',
  borderRadius: 12, color: '#e8f5e8', fontSize: 15,
  fontFamily: 'Georgia, serif', outline: 'none',
  boxSizing: 'border-box'
}