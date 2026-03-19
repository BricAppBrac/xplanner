import { useMemo } from 'react'
import { getZone } from '../lib/conseils'
import { getNow } from '../lib/dateTest'

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

function isInFenetre(debut, fin, mmdd) {
  if (!debut || !fin) return false
  if (debut <= fin) return mmdd >= debut && mmdd <= fin
  return mmdd >= debut || mmdd <= fin
}

function getMMDD() {
  const now = getNow()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

export default function CetteSemaine({ profile, legumesRef }) {
  const zone = getZone(profile)
  const mmdd = getMMDD()

  const semis = useMemo(() => {
    if (!legumesRef?.length) return []
    return legumesRef.filter(leg => {
      return isInFenetre(leg[`semis_abri_${zone}_debut`], leg[`semis_abri_${zone}_fin`], mmdd)
        || isInFenetre(leg[`semis_terre_${zone}_debut`], leg[`semis_terre_${zone}_fin`], mmdd)
    }).map(leg => {
      const mode = isInFenetre(leg[`semis_abri_${zone}_debut`], leg[`semis_abri_${zone}_fin`], mmdd) ? 'Sous abri' : 'En pleine terre'
      return { ...leg, mode }
    })
  }, [legumesRef, zone, mmdd])

  const plantations = useMemo(() => {
    if (!legumesRef?.length) return []
    return legumesRef.filter(leg => {
      return isInFenetre(leg[`plantation_${zone}_debut`], leg[`plantation_${zone}_fin`], mmdd)
    })
  }, [legumesRef, zone, mmdd])

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

  const itemStyle = {
    display: 'flex', alignItems: 'baseline', gap: 8,
    textAlign: 'left', fontSize: 15, lineHeight: 1.6, padding: '6px 0',
    borderBottom: '1px solid rgba(109,191,109,0.08)',
  }

  const puceStyle = {
    color: '#6dbf6d', fontWeight: 'bold', fontSize: 18, flexShrink: 0,
  }

  const emptyStyle = {
    color: '#6dbf6d', fontSize: 14, fontStyle: 'italic', textAlign: 'left',
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Amaranth, sans-serif' }}>
      <h2 style={{ color: '#e8f5e8', fontSize: 20, margin: '0 0 20px' }}>
        Cette semaine — zone {zone}
      </h2>

      {/* Semis possibles */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>🌱 Semis possibles cette semaine</div>
        {semis.length > 0 ? (
          semis.map((leg, i) => (
            <div key={i} style={itemStyle}>
              <span style={puceStyle}>›</span>
              <span style={{ color: '#e8f5e8', flex: 1 }}>
                {getEmoji(leg.nom)} <span style={{ fontWeight: 'bold' }}>{leg.nom}</span>
                <span style={{ color: '#a8d5a2' }}> — {leg.mode}</span>
                {leg.duree_culture_jours && <span style={{ color: '#7daa7d' }}> · {leg.duree_culture_jours}j</span>}
              </span>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Aucun semis possible cette semaine</div>
        )}
      </div>

      {/* Plantations possibles */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>🪴 Plantations possibles cette semaine</div>
        {plantations.length > 0 ? (
          plantations.map((leg, i) => (
            <div key={i} style={itemStyle}>
              <span style={puceStyle}>›</span>
              <span style={{ color: '#e8f5e8', flex: 1 }}>
                {getEmoji(leg.nom)} <span style={{ fontWeight: 'bold' }}>{leg.nom}</span>
                {leg.duree_culture_jours && <span style={{ color: '#7daa7d' }}> · {leg.duree_culture_jours}j</span>}
              </span>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Aucune plantation possible cette semaine</div>
        )}
      </div>
    </div>
  )
}
