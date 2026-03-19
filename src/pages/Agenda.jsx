import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { calculerCalendrier, chargerIncidents, INCIDENT_COLORS, INCIDENT_EMOJIS, INCIDENT_LABELS } from '../lib/calendrier'
import { getNow, toLocalDateStr } from '../lib/dateTest'

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

function getLabelDate(evt) {
  const now = getNow(); now.setHours(0, 0, 0, 0)
  const d = new Date(evt.date); d.setHours(0, 0, 0, 0)
  // Non confirmé → toujours "Saisi le", quelle que soit la date
  if (evt.type === 'semis' && (evt.statutCulture === 'a_semer' || evt.statutCulture === 'a_planter')) return 'Saisi le'
  if (evt.type === 'plantation' && evt.statutCulture === 'a_planter') return 'Saisi le'
  // Récolte non confirmée → toujours "Prévu le"
  if (evt.type === 'recolte' && evt.statutCulture !== 'recolte' && evt.statutCulture !== 'termine') return 'Prévu le'
  // Confirmé + date future → "Prévu le"
  if (d > now) return 'Prévu le'
  if (evt.type === 'semis') return 'Semé le'
  if (evt.type === 'plantation') return 'Planté le'
  if (evt.type === 'recolte') return 'Récolté le'
  return null
}

function BadgeStatut({ statut, type }) {
  if (statut === 'fait') {
    return (
      <span style={{
        background: 'rgba(109,191,109,0.25)', color: '#6dbf6d',
        fontSize: 13, fontWeight: 'bold',
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
        fontSize: 13, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        🌱 À faire
      </span>
    )
  }
  if (statut === 'en_cours') {
    return (
      <span style={{
        background: 'rgba(180,50,50,0.25)', color: '#e88888',
        border: '1px solid #c45555',
        fontSize: 13, fontWeight: 'bold',
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
        fontSize: 13, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
        animation: 'pulse 1.5s infinite',
      }}>
        Cette semaine
      </span>
    )
  }
  if (statut === 'a_venir' && (type === 'semis' || type === 'plantation')) {
    return (
      <span style={{
        background: 'rgba(168,213,162,0.15)', color: '#a8d5a2',
        fontSize: 13, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        À venir
      </span>
    )
  }
  if (statut === 'a_planifier') {
    return (
      <span style={{
        background: 'rgba(240,165,0,0.2)', color: '#f0a500',
        fontSize: 13, fontWeight: 'bold',
        padding: '2px 8px', borderRadius: 10,
      }}>
        À planifier
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

const INCIDENT_TYPES = [
  { value: 'gel', emoji: '🧊', label: 'Gel' },
  { value: 'grele', emoji: '🌩️', label: 'Grêle' },
  { value: 'ravageurs', emoji: '🐛', label: 'Ravageurs' },
  { value: 'maladie', emoji: '🍄', label: 'Maladie' },
  { value: 'secheresse', emoji: '🌵', label: 'Sécheresse' },
  { value: 'inondation', emoji: '🌊', label: 'Inondation' },
  { value: 'autre', emoji: '❓', label: 'Autre' },
]

export default function Agenda({ profile, session, cultures, legumesRef, onCultureChanged }) {
  const [revertId, setRevertId] = useState(null) // clé unique pour confirmation
  const [incidents, setIncidents] = useState([])
  const loadingRef = useRef(false)
  const [editId, setEditId] = useState(null) // evtKey de l'incident en cours d'édition
  const [editForm, setEditForm] = useState({ type: null, note: '', perte_pourcentage: 0 })
  const [editSaving, setEditSaving] = useState(false)
  const [filtreLegume, setFiltreLegume] = useState(null) // null = tous

  const calendrier = useMemo(
    () => calculerCalendrier(profile, cultures, legumesRef),
    [profile, cultures, legumesRef]
  )

  useEffect(() => { setFiltreLegume(null) }, [cultures])

  useEffect(() => {
    if (!session?.user?.id || loadingRef.current) return
    loadingRef.current = true
    chargerIncidents(session.user.id).then(data => {
      // Dédupliquer par id
      const seen = new Set()
      const uniques = data.filter(inc => {
        if (seen.has(inc.id)) return false
        seen.add(inc.id)
        return true
      })
      setIncidents(uniques)
      loadingRef.current = false
    }).catch(() => { loadingRef.current = false })
  }, [session?.user?.id, cultures])

  // Intégrer les incidents dans le calendrier par mois
  const calendrierAvecIncidents = useMemo(() => {
    // Deep copy des arrays pour éviter les doublons au re-render
    const result = {}
    for (const [key, evts] of Object.entries(calendrier)) {
      result[key] = [...evts]
    }
    // Dédupliquer les incidents par id
    const seen = new Set()
    for (const inc of incidents) {
      if (seen.has(inc.id)) continue
      seen.add(inc.id)
      const d = new Date(inc.date_incident)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!result[key]) result[key] = []
      result[key].push({
        date: d,
        legume: inc.cultures?.legume || '?',
        variete: inc.cultures?.variete || '',
        type: 'incident',
        incidentId: inc.id,
        incidentType: inc.type,
        incidentNote: inc.note,
        incidentPerte: inc.perte_pourcentage,
        label: `${INCIDENT_EMOJIS[inc.type] || '❓'} ${INCIDENT_LABELS[inc.type] || inc.type}`,
        statut: 'incident',
        color: INCIDENT_COLORS[inc.type] || '#7f8c8d',
      })
    }
    // Re-sort each month
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => a.date - b.date)
    }
    return result
  }, [calendrier, incidents])

  const [deleteId, setDeleteId] = useState(null) // clé unique pour confirmation suppression

  const handleRevert = async (cultureId, itineraire) => {
    const statutPrec = getStatutPrecedent(cultureId, itineraire, cultures)
    if (!statutPrec) return
    await supabase.from('cultures').update({ statut: statutPrec }).eq('id', cultureId)
    if (onCultureChanged) onCultureChanged()
    setRevertId(null)
  }

  const handleDelete = async (evt) => {
    if (evt.type === 'incident') {
      // Supprimer l'incident de la base
      await supabase.from('incidents').delete().eq('id', evt.incidentId)
    } else {
      // Masquer l'événement calculé via array_append
      await supabase.rpc('masquer_evenement', {
        p_culture_id: evt.cultureId,
        p_evt_id: evt.evtId,
      }).then(({ error }) => {
        // Fallback si la RPC n'existe pas : update direct
        if (error) {
          return supabase.from('cultures').update({
            evenements_masques: [...(cultures.find(c => c.id === evt.cultureId)?.evenements_masques || []), evt.evtId]
          }).eq('id', evt.cultureId)
        }
      })
    }
    setDeleteId(null)
    if (onCultureChanged) onCultureChanged()
  }

  const ouvrirEditIncident = (evtKey, evt) => {
    setEditId(evtKey)
    setEditForm({ type: evt.incidentType, note: evt.incidentNote || '', perte_pourcentage: evt.incidentPerte || 0, date_incident: toLocalDateStr(evt.date) })
    setDeleteId(null)
  }

  const enregistrerEditIncident = async (evt) => {
    if (!editForm.type) return
    setEditSaving(true)
    await supabase.from('incidents').update({
      type: editForm.type,
      note: editForm.note || null,
      perte_pourcentage: editForm.perte_pourcentage,
      date_incident: editForm.date_incident,
    }).eq('id', evt.incidentId)
    if (editForm.perte_pourcentage === 100) {
      // Trouver le culture_id via l'incident
      const inc = incidents.find(i => i.id === evt.incidentId)
      if (inc) {
        await supabase.from('cultures').update({ statut: 'termine' }).eq('id', inc.culture_id)
      }
    }
    setEditSaving(false)
    setEditId(null)
    if (onCultureChanged) onCultureChanged()
  }

  // Liste des légumes uniques présents dans le calendrier
  const legumesDisponibles = useMemo(() => {
    const noms = new Set()
    for (const evts of Object.values(calendrierAvecIncidents)) {
      for (const evt of evts) {
        if (evt.legume) noms.add(evt.legume)
      }
    }
    return [...noms].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [calendrierAvecIncidents])

  // Calendrier filtré par légume
  const calendrierFiltre = useMemo(() => {
    if (!filtreLegume) return calendrierAvecIncidents
    const result = {}
    for (const [key, evts] of Object.entries(calendrierAvecIncidents)) {
      const filtered = evts.filter(evt => evt.legume === filtreLegume)
      if (filtered.length > 0) result[key] = filtered
    }
    return result
  }, [calendrierAvecIncidents, filtreLegume])

  const moisKeys = Object.keys(calendrierFiltre).sort()
  const vide = Object.keys(calendrierAvecIncidents).length === 0

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
      ) : (<>
        {/* Filtre par légume */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <span
            onClick={() => setFiltreLegume(null)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Amaranth, sans-serif', fontWeight: 'bold',
              background: !filtreLegume ? 'rgba(109,191,109,0.2)' : 'rgba(255,255,255,0.05)',
              border: !filtreLegume ? '1px solid #6dbf6d' : '1px solid rgba(109,191,109,0.15)',
              color: !filtreLegume ? '#6dbf6d' : '#a8d5a2',
            }}
          >Tous</span>
          {legumesDisponibles.map(nom => (
            <span
              key={nom}
              onClick={() => setFiltreLegume(nom)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                fontFamily: 'Amaranth, sans-serif',
                background: filtreLegume === nom ? 'rgba(109,191,109,0.2)' : 'rgba(255,255,255,0.05)',
                border: filtreLegume === nom ? '1px solid #6dbf6d' : '1px solid rgba(109,191,109,0.15)',
                color: filtreLegume === nom ? '#6dbf6d' : '#a8d5a2',
              }}
            >{getEmoji(nom)} {nom}</span>
          ))}
        </div>

        {moisKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#a8d5a2', fontSize: 14, fontStyle: 'italic' }}>
            Aucun événement pour ce légume.
          </div>
        ) : moisKeys.map(key => {
          const [annee, moisNum] = key.split('-')
          const moisNom = `${MOIS_NOMS[parseInt(moisNum)]} ${annee}`
          const evts = calendrierFiltre[key]

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
                const isIncident = evt.type === 'incident'
                const labelDate = !isIncident ? getLabelDate(evt) : null
                const estFait = evt.statut === 'fait'
                const evtKey = isIncident
                  ? `incident-${evt.incidentType}-${i}`
                  : `${evt.cultureId}-${evt.type}-${evt.label}-${i}`
                const statutPrec = estFait ? getStatutPrecedent(evt.cultureId, evt.itineraire, cultures) : null
                const showRevert = revertId === evtKey
                const cultureTerminee = !isIncident && cultures.find(c => c.id === evt.cultureId)?.statut === 'termine'

                if (isIncident) {
                  const showDelete = deleteId === evtKey
                  return (
                    <div key={evtKey} style={{
                      padding: '10px 16px', marginBottom: 6,
                      background: 'rgba(255,120,80,0.15)',
                      borderLeft: '3px solid #c45555',
                      borderRadius: 10, textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#a8d5a2', fontSize: 13, flexShrink: 0, width: 52 }}>
                          {dateStr}
                        </span>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{getEmoji(evt.legume)}</span>
                        <span style={{ color: '#e8f5e8', fontSize: 15, fontWeight: 'bold' }}>
                          {evt.legume}{evt.variete ? ` – ${evt.variete}` : ''}
                        </span>
                        <span style={{ color: '#e88888', fontSize: 13 }}>
                          {evt.label}
                          {evt.incidentPerte > 0 ? ` — ${evt.incidentPerte}% perdu` : ''}
                        </span>
                        <span style={{ flexShrink: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            background: 'rgba(255,120,80,0.25)', color: '#e88888',
                            fontSize: 13, fontWeight: 'bold',
                            padding: '2px 8px', borderRadius: 10,
                          }}>
                            {INCIDENT_EMOJIS[evt.incidentType]} {INCIDENT_LABELS[evt.incidentType]}
                          </span>
                          {evt.incidentType !== 'recolte_terminee' && (
                            <span
                              onClick={() => ouvrirEditIncident(evtKey, evt)}
                              title="Modifier l'incident"
                              style={{
                                background: 'transparent', border: 'none',
                                color: '#6dbf6d', fontSize: 14, cursor: 'pointer',
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >✏️</span>
                          )}
                          <span
                            onClick={() => setDeleteId(showDelete ? null : evtKey)}
                            title="Supprimer de l'agenda"
                            style={{
                              background: 'transparent', border: 'none',
                              color: '#873f5f', fontSize: 14, cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >🗑️</span>
                        </span>
                      </div>
                      {evt.incidentNote && editId !== evtKey && (
                        <div style={{
                          color: '#a8d5a2', fontSize: 13, fontStyle: 'italic',
                          marginTop: 4, paddingLeft: 60,
                        }}>
                          {evt.incidentNote}
                        </div>
                      )}

                      {/* Formulaire édition incident */}
                      {editId === evtKey && (
                        <div style={{
                          marginTop: 10, padding: '12px 14px',
                          background: 'rgba(240,165,0,0.06)',
                          border: '1px solid rgba(240,165,0,0.25)',
                          borderRadius: 10,
                        }}>
                          <div style={{ color: '#f0a500', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>
                            ✏️ Modifier l'incident
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {INCIDENT_TYPES.map(t => (
                              <span
                                key={t.value}
                                onClick={() => setEditForm(prev => ({ ...prev, type: t.value }))}
                                style={{
                                  padding: '5px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                                  background: editForm.type === t.value ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)',
                                  border: editForm.type === t.value ? '1px solid #f0a500' : '1px solid rgba(109,191,109,0.15)',
                                  color: editForm.type === t.value ? '#f0a500' : '#a8d5a2',
                                  fontFamily: 'Amaranth, sans-serif',
                                }}
                              >{t.emoji} {t.label}</span>
                            ))}
                          </div>
                          <input
                            type="date"
                            value={editForm.date_incident}
                            onChange={e => setEditForm(prev => ({ ...prev, date_incident: e.target.value }))}
                            style={{
                              width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
                              color: '#e8f5e8', fontSize: 14, fontFamily: 'Amaranth, sans-serif',
                              outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Précise si besoin..."
                            value={editForm.note}
                            onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                            style={{
                              width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
                              color: '#e8f5e8', fontSize: 14, fontFamily: 'Amaranth, sans-serif',
                              outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                            }}
                          />
                          <div style={{ marginBottom: 6 }}>
                            <label style={{ color: '#a8d5a2', fontSize: 13 }}>
                              Perte estimée : <strong style={{ color: '#e8f5e8' }}>{editForm.perte_pourcentage}%</strong>
                            </label>
                            <input
                              type="range" min={0} max={100} step={5}
                              value={editForm.perte_pourcentage}
                              onChange={e => setEditForm(prev => ({ ...prev, perte_pourcentage: parseInt(e.target.value) }))}
                              style={{ width: '100%', accentColor: '#6dbf6d', marginTop: 4 }}
                            />
                          </div>
                          <div style={{
                            fontSize: 13, fontStyle: 'italic', marginBottom: 10,
                            color: editForm.perte_pourcentage === 100 ? '#f0a500' : '#6dbf6d',
                          }}>
                            {editForm.perte_pourcentage === 100
                              ? '⚠️ Perte totale — cette culture sera clôturée'
                              : 'La culture reste active'}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => enregistrerEditIncident(evt)}
                              disabled={!editForm.type || editSaving}
                              style={{
                                padding: '6px 14px',
                                background: (!editForm.type || editSaving) ? '#3a5a3a' : 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                                border: 'none', borderRadius: 8, color: '#fff', fontSize: 13,
                                cursor: (!editForm.type || editSaving) ? 'not-allowed' : 'pointer',
                                fontFamily: 'Amaranth, sans-serif', opacity: !editForm.type ? 0.5 : 1,
                              }}
                            >{editSaving ? 'Enregistrement...' : '✓ Enregistrer'}</button>
                            <button
                              onClick={() => setEditId(null)}
                              style={{
                                padding: '6px 14px', background: 'transparent',
                                border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8,
                                color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                              }}
                            >Annuler</button>
                          </div>
                        </div>
                      )}

                      {showDelete && (
                        <div style={{
                          marginTop: 8, padding: '8px 12px',
                          background: 'rgba(231,76,60,0.08)',
                          border: '1px solid rgba(231,76,60,0.25)',
                          borderRadius: 8,
                          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        }}>
                          <span style={{ color: '#e8f5e8', fontSize: 13 }}>Supprimer cet événement de l'agenda ?</span>
                          <button
                            onClick={() => handleDelete(evt)}
                            style={{
                              padding: '4px 12px', background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                              border: 'none', borderRadius: 6, color: '#fff', fontSize: 12,
                              cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                            }}
                          >✓ Confirmer</button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{
                              padding: '4px 12px', background: 'transparent',
                              border: '1px solid rgba(109,191,109,0.3)', borderRadius: 6,
                              color: '#a8d5a2', fontSize: 12, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                            }}
                          >Annuler</button>
                        </div>
                      )}
                    </div>
                  )
                }

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
                      <span style={{ color: '#a8d5a2', fontSize: 13, flexShrink: 0 }}>
                        {labelDate ? `${labelDate} ` : ''}{dateStr}
                      </span>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{getEmoji(evt.legume)}</span>
                      <span style={{ color: '#e8f5e8', fontSize: 15, fontWeight: 'bold' }}>
                        {evt.legume}{evt.variete ? ` – ${evt.variete}` : ''}
                      </span>
                      <span style={{ color: '#a8d5a2', fontSize: 13 }}>
                        {evt.label}
                      </span>
                      <span style={{ flexShrink: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BadgeStatut statut={evt.statut} type={evt.type} />
                        {estFait && statutPrec && (
                          <span
                            onClick={() => setRevertId(showRevert ? null : evtKey)}
                            title="Modifier le statut"
                            style={{
                              background: 'transparent', border: 'none',
                              color: '#6dbf6d', fontSize: 14, cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            ✏️
                          </span>
                        )}
                        <span
                          onClick={() => setDeleteId(deleteId === evtKey ? null : evtKey)}
                          title="Supprimer de l'agenda"
                          style={{
                            background: 'transparent', border: 'none',
                            color: '#873f5f', fontSize: 14, cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >🗑️</span>
                      </span>
                    </div>

                    {deleteId === evtKey && (
                      <div style={{
                        marginTop: 8, padding: '8px 12px',
                        background: 'rgba(231,76,60,0.08)',
                        border: '1px solid rgba(231,76,60,0.25)',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      }}>
                        <span style={{ color: '#e8f5e8', fontSize: 13 }}>Supprimer cet événement de l'agenda ?</span>
                        <button
                          onClick={() => handleDelete(evt)}
                          style={{
                            padding: '4px 12px', background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                            border: 'none', borderRadius: 6, color: '#fff', fontSize: 12,
                            cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                          }}
                        >✓ Confirmer</button>
                        <button
                          onClick={() => setDeleteId(null)}
                          style={{
                            padding: '4px 12px', background: 'transparent',
                            border: '1px solid rgba(109,191,109,0.3)', borderRadius: 6,
                            color: '#a8d5a2', fontSize: 12, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                          }}
                        >Annuler</button>
                      </div>
                    )}

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
      }</>)}
    </div>
  )
}
