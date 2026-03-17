import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { calculerCalendrier } from '../lib/calendrier'

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

const MOIS_NOMS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const PROGRESSIONS = {
  'A': ['a_semer', 'seme_abri_plateau', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'B': ['a_semer', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'C': ['a_semer', 'seme_place', 'recolte', 'termine'],
  'D': ['a_planter', 'plante', 'recolte', 'termine'],
}

const LABELS_STATUTS = {
  'a_semer': 'À semer',
  'a_planter': 'À planter',
  'seme_abri_plateau': 'Semé en plateau',
  'seme_abri_godet': 'Semé en godet',
  'seme_place': 'Semé en place',
  'plante': 'Planté / repiqué',
  'recolte': 'En récolte',
  'termine': 'Terminé',
}

function formatDateOrdinal(date) {
  const jour = date.getDate()
  const mois = date.toLocaleDateString('fr-FR', { month: 'short' })
  const ordinal = jour === 1 ? '1er' : jour.toString()
  return ordinal + ' ' + mois
}

function BadgeStatut({ statut }) {
  if (statut === 'fait') {
    return (
      <span style={{
        background: 'rgba(109,191,109,0.25)', color: '#6dbf6d',
        fontSize: 11, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        ✓ Fait
      </span>
    )
  }
  if (statut === 'a_faire') {
    return (
      <span style={{
        background: 'rgba(240,165,0,0.2)', color: '#f0a500',
        fontSize: 11, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        🌱 À faire
      </span>
    )
  }
  if (statut === 'en_cours') {
    return (
      <span style={{
        background: '#f0a500', color: '#1a2e1a',
        fontSize: 11, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
        animation: 'pulse 1.5s infinite',
      }}>
        En cours
      </span>
    )
  }
  if (statut === 'cette_semaine') {
    return (
      <span style={{
        background: '#f0a500', color: '#1a2e1a',
        fontSize: 11, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
        animation: 'pulse 1.5s infinite',
      }}>
        Cette semaine
      </span>
    )
  }
  return null
}

function getStatutPrecedent(cultureId, itineraire, cultures) {
  const culture = cultures.find(c => c.id === cultureId)
  if (!culture || !itineraire) return null
  const progression = PROGRESSIONS[itineraire]
  if (!progression) return null
  const idx = progression.indexOf(culture.statut)
  if (idx <= 0) return null
  return progression[idx - 1]
}

export default function Agenda({ profile, cultures, legumesRef, onCultureChanged }) {
  const [revertId, setRevertId] = useState(null) // clé unique pour confirmation

  const calendrier = useMemo(
    () => calculerCalendrier(profile, cultures, legumesRef),
    [profile, cultures, legumesRef]
  )

  const handleRevert = async (cultureId, itineraire) => {
    const statutPrec = getStatutPrecedent(cultureId, itineraire, cultures)
    if (!statutPrec) return
    await supabase.from('cultures').update({ statut: statutPrec }).eq('id', cultureId)
    if (onCultureChanged) onCultureChanged()
    setRevertId(null)
  }

  const moisKeys = Object.keys(calendrier).sort()
  const vide = moisKeys.length === 0

  return (
    <div style={{ padding: '16px 16px 24px', fontFamily: 'Amaranth, sans-serif' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {vide ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6dbf6d', fontSize: 16 }}>
          Ajoute des cultures dans ton jardin pour voir ton agenda de saison.
        </div>
      ) : (
        moisKeys.map(key => {
          const [annee, moisNum] = key.split('-')
          const moisNom = `${MOIS_NOMS[parseInt(moisNum)]} ${annee}`
          const evts = calendrier[key]

          return (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 20, fontWeight: 'bold', color: '#6dbf6d',
                padding: '10px 0 8px',
                borderBottom: '1px solid rgba(109,191,109,0.2)',
                marginBottom: 12,
              }}>
                {moisNom}
              </div>

              {evts.map((evt, i) => {
                const dateStr = formatDateOrdinal(evt.date)
                const estFait = evt.statut === 'fait'
                const evtKey = `${evt.cultureId}-${evt.type}-${evt.label}-${i}`
                const statutPrec = estFait ? getStatutPrecedent(evt.cultureId, evt.itineraire, cultures) : null
                const showRevert = revertId === evtKey
                const cultureTerminee = cultures.find(c => c.id === evt.cultureId)?.statut === 'termine'

                return (
                  <div key={evtKey} style={{
                    padding: '10px 16px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(109,191,109,0.1)',
                    borderRadius: 10,
                    textAlign: 'left',
                    opacity: cultureTerminee ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#a8d5a2', fontSize: 13, flexShrink: 0, width: 52 }}>
                        {dateStr}
                      </span>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{getEmoji(evt.legume)}</span>
                      <span style={{ color: '#e8f5e8', fontSize: 15, fontWeight: 'bold' }}>
                        {evt.legume}{evt.variete ? ` – ${evt.variete}` : ''}
                      </span>
                      <span style={{ color: '#a8d5a2', fontSize: 13 }}>
                        {evt.label}
                      </span>
                      <span style={{ flexShrink: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BadgeStatut statut={evt.statut} />
                        {estFait && statutPrec && (
                          <span
                            onClick={() => setRevertId(showRevert ? null : evtKey)}
                            style={{
                              color: '#556b55', fontSize: 14, cursor: 'pointer',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#a8d5a2'}
                            onMouseLeave={e => e.currentTarget.style.color = '#556b55'}
                          >
                            ✕
                          </span>
                        )}
                      </span>
                    </div>

                    {showRevert && statutPrec && (
                      <div style={{
                        marginTop: 8, padding: '8px 12px',
                        background: 'rgba(109,191,109,0.08)',
                        border: '1px solid rgba(109,191,109,0.25)',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      }}>
                        <span style={{ color: '#e8f5e8', fontSize: 13 }}>
                          Revenir à <strong style={{ color: '#6dbf6d' }}>{LABELS_STATUTS[statutPrec]}</strong> ?
                        </span>
                        <button
                          onClick={() => handleRevert(evt.cultureId, evt.itineraire)}
                          style={{
                            padding: '4px 12px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                            border: 'none', borderRadius: 6, color: '#fff', fontSize: 12,
                            cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                          }}
                        >✓ Confirmer</button>
                        <button
                          onClick={() => setRevertId(null)}
                          style={{
                            padding: '4px 12px', background: 'transparent',
                            border: '1px solid rgba(109,191,109,0.3)', borderRadius: 6,
                            color: '#a8d5a2', fontSize: 12, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                          }}
                        >✗ Annuler</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}
