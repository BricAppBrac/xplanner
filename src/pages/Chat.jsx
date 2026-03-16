import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getConseilsJour } from '../lib/conseils'

const EMOJI_MAP = {
  tomate: '🍅', courgette: '🥒', concombre: '🥒',
  courge: '🎃', potiron: '🎃', butternut: '🎃',
  'haricot vert': '🫘', 'haricot a rames': '🫘', feve: '🫘',
  basilic: '🌿', persil: '🌿',
  piment: '🌶️', poivron: '🌶️',
  aubergine: '🍆',
  carotte: '🥕', radis: '🥕', navet: '🥕', panais: '🥕', betterave: '🥕',
  laitue: '🥗', roquette: '🥗', mesclun: '🥗', mache: '🥗', epinard: '🥗',
  oignon: '🧅', echalote: '🧅',
  ail: '🧄',
  poireau: '🌱', celeri: '🌱', fenouil: '🌱',
  brocoli: '🥦', chou: '🥦', 'chou kale': '🥦', 'chou-fleur': '🥦',
  fraise: '🍓',
  mais: '🌽',
  'petit pois': '🫘', 'pois gourmands': '🫘',
}

function getEmoji(legume) {
  const key = (legume || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return EMOJI_MAP[key] || '🌱'
}

function groupByLegume(items, keyFn) {
  const groups = {}
  for (const item of items) {
    const key = keyFn(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return Object.entries(groups)
}

export default function Chat({ profile, onClose }) {
  const [conseils, setConseils] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const [{ data }, { data: legRef }] = await Promise.all([
        supabase.from('cultures').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('legumes_ref').select('*'),
      ])
      const c = getConseilsJour(profile, data || [], legRef || [])
      setConseils(c)
      setLoading(false)
    }
    init()
  }, [profile])

  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(109,191,109,0.15)',
    borderRadius: 14, padding: '16px 18px', marginBottom: 14,
    textAlign: 'left',
  }

  const sectionTitleStyle = {
    fontSize: 18, fontWeight: 'bold', color: '#6dbf6d',
    paddingBottom: 8, marginBottom: 10,
    borderBottom: '1px solid rgba(109,191,109,0.2)',
  }

  const legumeTitleStyle = {
    fontSize: 16, color: '#e8f5e8',
    background: 'rgba(109,191,109,0.1)',
    padding: '6px 12px', borderRadius: 8, marginBottom: 8,
  }

  const itemStyle = {
    display: 'flex', alignItems: 'baseline', gap: 8,
    textAlign: 'left', fontSize: 15, lineHeight: 1.6, padding: '4px 0 4px 16px',
    borderBottom: '1px solid rgba(109,191,109,0.08)',
  }

  const puceStyle = {
    color: '#6dbf6d', fontWeight: 'bold', fontSize: 18, flexShrink: 0,
  }

  const emptyStyle = {
    color: '#6dbf6d', fontSize: 14, fontStyle: 'italic', textAlign: 'left',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,20,10,0.98)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Amaranth, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(109,191,109,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src="/src/img/ElfynIdee1024_transp.png" alt="Elfyn" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <div style={{ color: '#e8f5e8', fontSize: 24, fontWeight: 'bold' }}>Conseils du jour</div>
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#a8d5a2', fontSize: 22, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6dbf6d', fontSize: 16 }}>
            Elfyn prépare tes conseils...
          </div>
        ) : !conseils ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6dbf6d', fontSize: 16 }}>
            Impossible de charger les conseils.
          </div>
        ) : (
          <>
            {/* Tâches urgentes */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Tâches cette semaine</div>
              {conseils.taches_urgentes.length > 0 ? (
                groupByLegume(conseils.taches_urgentes, t => t.legume + (t.variete ? ' – ' + t.variete : '')).map(([legume, taches], gi) => (
                  <div key={gi} style={{ marginBottom: 16 }}>
                    <div style={legumeTitleStyle}>{getEmoji(taches[0].legume)} {legume}</div>
                    {taches.map((t, i) => (
                      <div key={i} style={itemStyle}>
                        <span style={puceStyle}>›</span>
                        <span style={{ color: '#c4d4c4' }}>{t.tache}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div style={emptyStyle}>Rien d'urgent cette semaine, profites-en !</div>
              )}
            </div>

            {/* Suggestions de semis */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Fenêtres de semis ouvertes</div>
              {conseils.suggestions_semis.length > 0 ? (
                conseils.suggestions_semis.map((s, i) => (
                  <div key={i} style={itemStyle}>
                    <span style={puceStyle}>›</span>
                    <span style={{ color: '#e8f5e8' }}>
                      {getEmoji(s.legume)} <span style={{ color: '#6dbf6d', fontWeight: 'bold' }}>{s.legume}</span>
                      <span style={{ color: '#a8d5a2' }}> ({s.mode})</span>
                    </span>
                  </div>
                ))
              ) : (
                <div style={emptyStyle}>Aucun semis à lancer cette semaine</div>
              )}
            </div>

            {/* Successions */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Successions possibles</div>
              {conseils.successions.length > 0 ? (
                conseils.successions.map((s, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={legumeTitleStyle}>{getEmoji(s.apres)} Après tes {s.apres}</div>
                    {s.suggestions.map((sug, j) => (
                      <div key={j} style={itemStyle}>
                        <span style={puceStyle}>›</span>
                        <span style={{ color: '#a8d5a2' }}>{sug.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div style={emptyStyle}>Aucune place libérée pour l'instant</div>
              )}
            </div>

            {/* Récoltes prochaines */}
            <div style={{ ...sectionStyle, borderColor: 'rgba(240,165,0,0.25)' }}>
              <div style={{ ...sectionTitleStyle, color: '#f0a500', borderBottomColor: 'rgba(240,165,0,0.25)' }}>Récoltes à surveiller</div>
              {conseils.recoltes_prochaines?.length > 0 ? (
                conseils.recoltes_prochaines.map((r, i) => (
                  <div key={i} style={itemStyle}>
                    <span style={{ ...puceStyle, color: '#f0a500' }}>›</span>
                    <span style={{ color: '#e8f5e8' }}>
                      {getEmoji(r.legume)} <span style={{ fontWeight: 'bold' }}>{r.legume}{r.variete ? ' – ' + r.variete : ''}</span>
                      <span style={{ color: '#f0a500' }}>
                        {r.jours_restants === 0
                          ? ' — prêt à récolter !'
                          : ` — maturité estimée dans ${r.jours_restants} jour${r.jours_restants > 1 ? 's' : ''}`}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div style={emptyStyle}>Aucune récolte proche</div>
              )}
            </div>

            {/* Alertes */}
            {conseils.alertes.length > 0 && (
              <div style={{ ...sectionStyle, borderColor: 'rgba(200,100,50,0.3)' }}>
                <div style={{ ...sectionTitleStyle, color: '#e6a835', borderBottomColor: 'rgba(230,168,53,0.3)' }}>Alertes</div>
                {conseils.alertes.map((a, i) => (
                  <div key={i} style={itemStyle}>
                    <span style={{ ...puceStyle, color: '#e6a835' }}>›</span>
                    <span style={{ color: '#e6a835' }}>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
