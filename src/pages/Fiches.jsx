import { useState } from 'react'
import { getZone } from '../lib/conseils'
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

const ORDRE_STADES = ['a_semer', 'en_godets', 'en_place', 'recolte', 'termine']
const LABELS_STADES = {
  'a_semer': 'À semer',
  'en_godets': 'En godets / plateaux',
  'en_place': 'En place',
  'recolte': 'En récolte',
  'termine': 'Terminé',
}

const ALERTES_EMOJIS = {
  gel: '🧊',
  canicule: '☀️',
  secheresse: '🏜️',
  pluie_prolongee: '🌧️',
}

const ALERTES_LABELS = {
  gel: 'Gel',
  canicule: 'Canicule',
  secheresse: 'Sécheresse',
  pluie_prolongee: 'Pluie prolongée',
}

function eauEmoji(niveau) {
  if (!niveau) return ''
  const n = niveau.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (n.includes('eleve') || n.includes('important')) return '💧💧💧 ' + niveau
  if (n.includes('moyen') || n.includes('modere')) return '💧💧 ' + niveau
  return '💧 ' + niveau
}

function FicheDetail({ legume, zone, onBack }) {
  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(109,191,109,0.15)',
    borderRadius: 12, padding: '14px 16px', marginBottom: 12,
    textAlign: 'left',
  }
  const sectionTitleStyle = {
    fontSize: 16, fontWeight: 'bold', color: '#6dbf6d',
    marginBottom: 10, paddingBottom: 6,
    borderBottom: '1px solid rgba(109,191,109,0.2)',
  }
  const labelStyle = { color: '#6dbf6d', fontSize: 13, marginBottom: 2 }
  const valueStyle = { color: '#e8f5e8', fontSize: 15 }
  const itemStyle = { display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 0 2px 12px' }

  const semisAbri = { debut: legume[`semis_abri_${zone}_debut`], fin: legume[`semis_abri_${zone}_fin`] }
  const semisTerre = { debut: legume[`semis_terre_${zone}_debut`], fin: legume[`semis_terre_${zone}_fin`] }
  const plantation = { debut: legume[`plantation_${zone}_debut`], fin: legume[`plantation_${zone}_fin`] }
  const recolte = { debut: legume[`recolte_${zone}_debut`], fin: legume[`recolte_${zone}_fin`] }
  const hasCal = semisAbri.debut || semisTerre.debut || plantation.debut || recolte.debut
  const stades = legume.taches_par_stade || {}
  const alertes = legume.alertes_saisonnieres || {}

  return (
    <div>
      {/* Bouton retour */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: 'none',
          color: '#6dbf6d', fontSize: 15, cursor: 'pointer',
          fontFamily: 'Amaranth, sans-serif', padding: '0 0 16px',
        }}
      >
        ← Retour à la liste
      </button>

      {/* En-tête */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e8f5e8', marginBottom: 4 }}>
          {getEmoji(legume.nom)} {legume.nom}
        </div>
        {legume.famille && (
          <div style={{ color: '#a8d5a2', fontSize: 14, marginBottom: 8 }}>{legume.famille}</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 14 }}>
          {legume.besoins_eau && (
            <span style={{ color: '#5aafc4' }}>{eauEmoji(legume.besoins_eau)}</span>
          )}
          {legume.espacement_cm && (
            <span style={{ color: '#a8d5a2' }}>📏 {legume.espacement_cm}cm entre plants</span>
          )}
          {legume.duree_culture_jours && (
            <span style={{ color: '#a8d5a2' }}>⏱️ {legume.duree_culture_jours} jours</span>
          )}
        </div>
      </div>

      {/* Calendrier */}
      {hasCal && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📅 Calendrier zone {zone}</div>
          {semisAbri.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Semis sous abri</div>
              <div style={valueStyle}>du {semisAbri.debut} au {semisAbri.fin}</div>
            </div>
          )}
          {semisTerre.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Semis pleine terre</div>
              <div style={valueStyle}>du {semisTerre.debut} au {semisTerre.fin}</div>
            </div>
          )}
          {plantation.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Plantation</div>
              <div style={valueStyle}>du {plantation.debut} au {plantation.fin}</div>
            </div>
          )}
          {recolte.debut && (
            <div style={{ marginBottom: 6 }}>
              <div style={labelStyle}>Récolte</div>
              <div style={valueStyle}>du {recolte.debut} au {recolte.fin}</div>
            </div>
          )}
        </div>
      )}

      {/* Tâches par stade */}
      {Object.keys(stades).length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📋 Tâches par stade</div>
          {Object.entries(stades)
            .sort(([a], [b]) => (ORDRE_STADES.indexOf(a) === -1 ? 99 : ORDRE_STADES.indexOf(a)) - (ORDRE_STADES.indexOf(b) === -1 ? 99 : ORDRE_STADES.indexOf(b)))
            .map(([stade, taches]) => (
              <div key={stade} style={{ marginBottom: 10 }}>
                <div style={{ color: '#6dbf6d', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                  {LABELS_STADES[stade] || stade}
                </div>
                {taches.map((t, i) => (
                  <div key={i} style={itemStyle}>
                    <span style={{ color: '#6dbf6d', fontWeight: 'bold', fontSize: 16 }}>›</span>
                    <span style={{ color: '#e8f5e8', fontSize: 14 }}>{t}</span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Alertes saisonnières */}
      {Object.keys(alertes).length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>⚠️ Alertes saisonnières</div>
          {Object.entries(alertes).map(([type, message]) => (
            <div key={type} style={{ marginBottom: 8 }}>
              <div style={{ color: '#e6a835', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>
                {ALERTES_EMOJIS[type] || '⚠️'} {ALERTES_LABELS[type] || type}
              </div>
              <div style={{ color: '#e8f5e8', fontSize: 14, paddingLeft: 12 }}>{message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Associations */}
      {(legume.associations?.length > 0 || legume.rotations_eviter?.length > 0) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🤝 Associations</div>
          {legume.associations?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#6dbf6d', fontSize: 14, marginBottom: 4 }}>✅ Bonnes associations</div>
              <div style={valueStyle}>{legume.associations.map(s => slugToLabel(s)).join(', ')}</div>
            </div>
          )}
          {legume.rotations_eviter?.length > 0 && (
            <div>
              <div style={{ color: '#e6a835', fontSize: 14, marginBottom: 4 }}>❌ À éviter</div>
              <div style={{ ...valueStyle, color: '#e6a835' }}>{legume.rotations_eviter.map(s => slugToLabel(s)).join(', ')}</div>
            </div>
          )}
        </div>
      )}

      {/* Successions */}
      {legume.successions?.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>🔄 Successions</div>
          <div style={valueStyle}>Après ce légume, tu peux planter : {legume.successions.map(s => slugToLabel(s)).join(', ')}</div>
        </div>
      )}

      {/* Notes */}
      {legume.notes && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>📝 Notes</div>
          <div style={{ color: '#e8f5e8', fontSize: 14, lineHeight: 1.6 }}>{legume.notes}</div>
        </div>
      )}
    </div>
  )
}

export default function Fiches({ legumesRef, profile }) {
  const [selectedId, setSelectedId] = useState(null)
  const zone = getZone(profile)

  const selectedLegume = legumesRef?.find(l => l.id === selectedId) || null
  const legumesTriees = [...(legumesRef || [])].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))

  return (
    <div style={{ padding: 20, fontFamily: 'Amaranth, sans-serif' }}>
      {selectedLegume ? (
        <FicheDetail legume={selectedLegume} zone={zone} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <h2 style={{ color: '#e8f5e8', fontSize: 20, margin: '0 0 16px' }}>
            Fiches légumes
          </h2>

          {/* Recherche */}
          <div style={{ marginBottom: 16 }}>
            <LegumeSearch
              value={selectedId}
              onChange={v => setSelectedId(v)}
              placeholder="Rechercher un légume..."
              options={(legumesRef || []).map(l => ({ value: l.id, label: l.nom }))}
            />
          </div>

          {/* Liste alphabétique */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {legumesTriees.map(leg => (
              <div
                key={leg.id}
                onClick={() => setSelectedId(leg.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(109,191,109,0.1)',
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,191,109,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span style={{ fontSize: 20 }}>{getEmoji(leg.nom)}</span>
                <span style={{ color: '#e8f5e8', fontSize: 16, fontWeight: 'bold' }}>{leg.nom}</span>
                {leg.famille && <span style={{ color: '#7daa7d', fontSize: 12, marginLeft: 'auto' }}>{leg.famille}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
