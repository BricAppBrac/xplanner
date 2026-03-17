import { useMemo } from 'react'
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

function BadgeStatut({ statut }) {
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
  if (statut === 'en_cours') {
    return (
      <span style={{
        background: 'rgba(109,191,109,0.25)', color: '#6dbf6d',
        fontSize: 11, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        En cours
      </span>
    )
  }
  return null
}

export default function Agenda({ profile, cultures, legumesRef }) {
  const calendrier = useMemo(
    () => calculerCalendrier(profile, cultures, legumesRef),
    [profile, cultures, legumesRef]
  )

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
              {/* En-tête du mois */}
              <div style={{
                fontSize: 20, fontWeight: 'bold', color: '#6dbf6d',
                padding: '10px 0 8px',
                borderBottom: '1px solid rgba(109,191,109,0.2)',
                marginBottom: 12,
              }}>
                {moisNom}
              </div>

              {/* Événements */}
              {evts.map((evt, i) => {
                const jour = evt.date.getDate()

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(109,191,109,0.1)',
                    borderRadius: 10,
                  }}>
                    {/* Date */}
                    <div style={{
                      width: 38, textAlign: 'center', flexShrink: 0,
                      color: '#a8d5a2',
                      fontSize: 20, fontWeight: 'bold',
                    }}>
                      {jour}
                    </div>

                    {/* Emoji */}
                    <div style={{ fontSize: 22, flexShrink: 0 }}>
                      {getEmoji(evt.legume)}
                    </div>

                    {/* Détails */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#e8f5e8',
                        fontSize: 15, fontWeight: 'bold',
                      }}>
                        {evt.legume}{evt.variete ? ` – ${evt.variete}` : ''}
                      </div>
                      <div style={{
                        color: '#a8d5a2',
                        fontSize: 13, marginTop: 2,
                      }}>
                        {evt.label}
                      </div>
                    </div>

                    {/* Badge */}
                    <BadgeStatut statut={evt.statut} />
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
