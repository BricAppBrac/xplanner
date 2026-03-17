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

function formatDateOrdinal(date) {
  const jour = date.getDate()
  const mois = date.toLocaleDateString('fr-FR', { month: 'short' })
  const ordinal = jour === 1 ? '1er' : jour.toString()
  return ordinal + ' ' + mois
}

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
                const dateStr = formatDateOrdinal(evt.date)

                return (
                  <div key={i} style={{
                    padding: '10px 16px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(109,191,109,0.1)',
                    borderRadius: 10,
                    textAlign: 'left',
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
                      <span style={{ flexShrink: 0, marginLeft: 'auto' }}>
                        <BadgeStatut statut={evt.statut} />
                      </span>
                    </div>
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
