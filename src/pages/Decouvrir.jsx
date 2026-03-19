import { useState, useMemo } from 'react'
import { getZone } from '../lib/conseils'
import { getNow } from '../lib/dateTest'
import { slugToLabel } from '../lib/utils'
import LegumeSearch from '../components/ui/LegumeSearch'

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

const ORDRE_STADES = ['a_semer', 'en_godets', 'en_place', 'recolte', 'termine']

const LABELS_STADES = {
  'a_semer': 'A semer',
  'en_godets': 'En godets / plateaux',
  'en_place': 'En place',
  'recolte': 'A récolter',
  'termine': 'Récolte terminée',
}

function FicheLegume({ legume, zone }) {
  if (!legume) return null

  const semisAbri = { debut: legume[`semis_abri_${zone}_debut`], fin: legume[`semis_abri_${zone}_fin`] }
  const semisTerre = { debut: legume[`semis_terre_${zone}_debut`], fin: legume[`semis_terre_${zone}_fin`] }
  const plantation = { debut: legume[`plantation_${zone}_debut`], fin: legume[`plantation_${zone}_fin`] }
  const recolte = { debut: legume[`recolte_${zone}_debut`], fin: legume[`recolte_${zone}_fin`] }
  const hasCal = semisAbri.debut || semisTerre.debut || plantation.debut || recolte.debut
  const stades = legume.taches_par_stade || {}

  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(109,191,109,0.15)',
    borderRadius: 12, padding: '14px 16px', marginBottom: 12,
    textAlign: 'left',
  }

  const labelStyle = { color: '#6dbf6d', fontSize: 13, marginBottom: 2 }
  const valueStyle = { color: '#e8f5e8', fontSize: 15 }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#e8f5e8', marginBottom: 14, textAlign: 'left' }}>
        {getEmoji(legume.nom)} {legume.nom}
      </div>

      {/* Calendrier */}
      {hasCal && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#6dbf6d', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(109,191,109,0.2)' }}>
            Calendrier — zone {zone}
          </div>
          {semisAbri.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Semis sous abri</div>
              <div style={valueStyle}>{semisAbri.debut} → {semisAbri.fin}</div>
            </div>
          )}
          {semisTerre.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Semis pleine terre</div>
              <div style={valueStyle}>{semisTerre.debut} → {semisTerre.fin}</div>
            </div>
          )}
          {plantation.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Plantation</div>
              <div style={valueStyle}>{plantation.debut} → {plantation.fin}</div>
            </div>
          )}
          {recolte.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Récolte</div>
              <div style={valueStyle}>{recolte.debut} → {recolte.fin}</div>
            </div>
          )}
          {legume.duree_culture_jours && (
            <div>
              <div style={labelStyle}>Durée de culture</div>
              <div style={valueStyle}>{legume.duree_culture_jours} jours</div>
            </div>
          )}
        </div>
      )}

      {/* Tâches par stade */}
      {Object.keys(stades).length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#6dbf6d', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(109,191,109,0.2)' }}>
            Tâches par stade
          </div>
          {Object.entries(stades).sort(([a], [b]) => (ORDRE_STADES.indexOf(a) === -1 ? 99 : ORDRE_STADES.indexOf(a)) - (ORDRE_STADES.indexOf(b) === -1 ? 99 : ORDRE_STADES.indexOf(b))).map(([stade, taches]) => (
            <div key={stade} style={{ marginBottom: 10 }}>
              <div style={{ color: '#a8d5a2', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{LABELS_STADES[stade] || stade}</div>
              {taches.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 0 2px 12px' }}>
                  <span style={{ color: '#6dbf6d', fontWeight: 'bold', fontSize: 16 }}>›</span>
                  <span style={{ color: '#e8f5e8', fontSize: 14 }}>{t}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Associations & rotations */}
      {(legume.associations_benefiques?.length > 0 || legume.rotations_a_eviter?.length > 0) && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#6dbf6d', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(109,191,109,0.2)' }}>
            Associations & rotations
          </div>
          {legume.associations_benefiques?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>Associations bénéfiques</div>
              <div style={valueStyle}>{legume.associations_benefiques.join(', ')}</div>
            </div>
          )}
          {legume.rotations_a_eviter?.length > 0 && (
            <div>
              <div style={labelStyle}>Rotations à éviter</div>
              <div style={{ ...valueStyle, color: '#e6a835' }}>{legume.rotations_a_eviter.join(', ')}</div>
            </div>
          )}
        </div>
      )}

      {/* Successions */}
      {legume.successions?.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#6dbf6d', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(109,191,109,0.2)' }}>
            Successions possibles
          </div>
          <div style={valueStyle}>{legume.successions.map(s => slugToLabel(s)).join(', ')}</div>
        </div>
      )}
    </div>
  )
}

export default function Decouvrir({ profile, legumesRef }) {
  const [selectedId, setSelectedId] = useState(null)
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

  const selectedLegume = legumesRef?.find(l => l.id === selectedId) || null

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <img src="/src/img/ElfynIdee1024_transp.png" alt="Elfyn" style={{ width: 50, height: 50, objectFit: 'contain' }} />
        <h2 style={{ color: '#e8f5e8', fontSize: 20, margin: 0 }}>
          Découvrir — zone {zone}
        </h2>
      </div>

      {/* Semis possibles */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Semis possibles cette semaine</div>
        {semis.length > 0 ? (
          semis.map((leg, i) => (
            <div key={i} style={itemStyle}>
              <span style={puceStyle}>›</span>
              <span style={{ color: '#e8f5e8', flex: 1 }}>
                {getEmoji(leg.nom)} <span style={{ fontWeight: 'bold' }}>{leg.nom}</span>
                <span style={{ color: '#a8d5a2' }}> — {leg.mode}</span>
                {leg.duree_culture_jours && <span style={{ color: '#7daa7d' }}> · {leg.duree_culture_jours}j</span>}
                {leg.besoin_eau && <span style={{ color: '#5aafc4' }}> · eau : {leg.besoin_eau}</span>}
              </span>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Aucun semis possible cette semaine</div>
        )}
      </div>

      {/* Plantations possibles */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Plantations possibles cette semaine</div>
        {plantations.length > 0 ? (
          plantations.map((leg, i) => (
            <div key={i} style={itemStyle}>
              <span style={puceStyle}>›</span>
              <span style={{ color: '#e8f5e8', flex: 1 }}>
                {getEmoji(leg.nom)} <span style={{ fontWeight: 'bold' }}>{leg.nom}</span>
                {leg.duree_culture_jours && <span style={{ color: '#7daa7d' }}> · {leg.duree_culture_jours}j</span>}
                {leg.besoin_eau && <span style={{ color: '#5aafc4' }}> · eau : {leg.besoin_eau}</span>}
              </span>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Aucune plantation possible cette semaine</div>
        )}
      </div>

      {/* Explorer un légume */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Explorer un légume</div>
        <LegumeSearch
          value={selectedId}
          onChange={v => setSelectedId(v)}
          placeholder="Rechercher un légume..."
          options={(legumesRef || []).map(l => ({ value: l.id, label: l.nom }))}
        />
        <FicheLegume legume={selectedLegume} zone={zone} />
      </div>
    </div>
  )
}
