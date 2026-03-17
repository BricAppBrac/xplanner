import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getConseilsJour } from '../lib/conseils'
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

function groupByLegume(items, keyFn) {
  const groups = {}
  for (const item of items) {
    const key = keyFn(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return Object.entries(groups)
}

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
          color: selected ? '#e8f5e8' : '#6dbf6d', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
          boxSizing: 'border-box', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{selected ? selected.label : placeholder || '-- Choisir --'}</span>
        <span style={{ fontSize: 10, color: '#6dbf6d' }}>{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: '#1a2e1a', border: '1px solid rgba(109,191,109,0.25)',
          borderRadius: 10, marginTop: 4, maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onMouseEnter={() => setHovered(o.value)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                padding: '9px 12px', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
                color: '#e8f5e8', cursor: 'pointer',
                background: hovered === o.value ? '#2d4a2d' : 'transparent',
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
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

const COULEURS_STATUTS = {
  'a_semer': '#f0a500',
  'a_planter': '#f0a500',
  'seme_abri_plateau': '#4a9e4a',
  'seme_abri_godet': '#4a9e4a',
  'seme_place': '#4a9e4a',
  'plante': '#6dbf6d',
  'recolte': '#873f5f',
  'termine': '#555',
}

// Pour le formulaire d'ajout (statuts initiaux uniquement)
const STATUTS = [
  { value: 'a_semer', label: 'À semer', color: '#f0a500' },
  { value: 'a_planter', label: 'À planter', color: '#f0a500' },
  { value: 'seme_abri_plateau', label: 'Semé en plateau', color: '#4a9e4a' },
  { value: 'seme_abri_godet', label: 'Semé en godet', color: '#4a9e4a' },
  { value: 'seme_place', label: 'Semé en place', color: '#4a9e4a' },
  { value: 'plante', label: 'Planté / repiqué', color: '#6dbf6d' },
  { value: 'recolte', label: 'En récolte', color: '#873f5f' },
  { value: 'termine', label: 'Terminé', color: '#555' },
]

const CONSEILS_ECHELONNEMENT = {
  'Radis': { intervalle: 1, conseil: 'Croissance très rapide (25 jours). Semer toutes les semaines pour des récoltes vraiment continues.' },
  'Mesclun': { intervalle: 1, conseil: 'Prêt en 35 jours. Un semis par semaine garantit une salade fraîche en permanence.' },
  'Roquette': { intervalle: 1, conseil: 'Monte vite en graine. Semer toutes les semaines pour toujours avoir de jeunes pousses.' },
  'Laitue': { intervalle: 2, conseil: 'Prête en 45 jours. Toutes les 2 semaines évite d\'avoir 10 salades d\'un coup.' },
  'Épinard': { intervalle: 2, conseil: 'Récolte en 40 jours. Échelonner toutes les 2 semaines pour une récolte continue.' },
  'Haricot vert': { intervalle: 2, conseil: 'Récolte en 60 jours. 2 semaines entre chaque semis pour étaler la production.' },
  'Haricot à rames': { intervalle: 2, conseil: 'Production longue mais démarrage groupé. 2 semaines d\'écart conseillé.' },
  'Carotte': { intervalle: 3, conseil: 'Longue culture (90 jours). Semer toutes les 3 semaines de février à juillet.' },
  'Betterave': { intervalle: 3, conseil: 'Culture de 80 jours. 3 semaines d\'intervalle pour étaler les récoltes.' },
  'Navet': { intervalle: 3, conseil: 'Prêt en 60 jours. Semer toutes les 3 semaines de mars à septembre.' },
  'Petit pois': { intervalle: 3, conseil: 'Récolte groupée en 70 jours. 3 semaines entre chaque rang.' },
  'Pois gourmands': { intervalle: 3, conseil: 'Même logique que les petits pois. 3 semaines entre chaque semis.' },
  'Tomate': { intervalle: 4, conseil: 'Culture longue (90 jours). Un seul semis suffit généralement.' },
  'Poivron': { intervalle: 4, conseil: 'Cycle très long. Un seul semis en janvier-février est la norme.' },
  'Aubergine': { intervalle: 4, conseil: 'Même logique que le poivron. Un seul semis suffit.' },
  'Courgette': { intervalle: 4, conseil: 'Très productive sur une longue période. Un seul semis suffit.' },
  'Basilic': { intervalle: 2, conseil: 'Monte vite en fleur. Semer toutes les 2 semaines pour toujours avoir du basilic frais.' },
  'Persil': { intervalle: 4, conseil: 'Bisannuel et persistant. Un seul semis par saison suffit.' },
}

const CONSEIL_DEFAUT = 'En général, 2 à 3 semaines entre chaque semis permet d\'échelonner les récoltes.'

const ITINERAIRES_CARTES = [
  { id: 'A', emoji: '🌱', titre: 'Semis en plateau puis godets', desc: 'Je sème en plateau, je repiquerai en godets avant de planter en terre', statutInitial: 'a_semer' },
  { id: 'B', emoji: '🪴', titre: 'Semis en godets', desc: 'Je sème directement en godets individuels sous abri avant de planter en terre', statutInitial: 'a_semer' },
  { id: 'C', emoji: '🌍', titre: 'Semis direct en place', desc: 'Je sème directement en pleine terre, pas de transplantation', statutInitial: 'a_semer' },
  { id: 'D', emoji: '🛒', titre: 'Plantation directe', desc: 'J\'achète un plant ou j\'utilise un stolon/caïeu, je plante directement', statutInitial: 'a_planter' },
]

const PROGRESSIONS = {
  'A': ['a_semer', 'seme_abri_plateau', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'B': ['a_semer', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'C': ['a_semer', 'seme_place', 'recolte', 'termine'],
  'D': ['a_planter', 'plante', 'recolte', 'termine'],
}

const STATUTS_SEMIS = ['seme_abri_plateau', 'seme_abri_godet', 'seme_place']

const ITINERAIRES_SUGGERES = {
  'Tomate': 'B', 'Aubergine': 'B', 'Poivron': 'B',
  'Piment': 'B', 'Courgette': 'B', 'Concombre': 'B',
  'Courge': 'B', 'Potiron': 'B', 'Butternut': 'B',
  'Céleri': 'B', 'Poireau': 'B', 'Oignon': 'B',
  'Brocoli': 'B', 'Chou': 'B', 'Chou-fleur': 'B',
  'Chou kale': 'B', 'Fenouil': 'B', 'Basilic': 'B',
  'Persil': 'B', 'Laitue': 'B',
  'Carotte': 'C', 'Radis': 'C', 'Betterave': 'C',
  'Navet': 'C', 'Panais': 'C', 'Haricot vert': 'C',
  'Haricot à rames': 'C', 'Petit pois': 'C',
  'Pois gourmands': 'C', 'Fève': 'C', 'Maïs': 'C',
  'Épinard': 'C', 'Roquette': 'C', 'Mesclun': 'C',
  'Mâche': 'C',
  'Fraise': 'D', 'Ail': 'D', 'Échalote': 'D',
}

const formVide = { legume: '', legume_ref_id: null, variete: '', itineraire: null, date_semis: '', notes: '', nb_semis: 1, intervalle_semis_semaines: 2 }

export default function Jardin({ profile, session, cultures: culturesProp, legumesRef: legumesRefProp, onCultureChanged }) {
  const [culturesLocal, setCulturesLocal] = useState([])
  const [legumesRefLocal, setLegumesRefLocal] = useState([])
  const [modalOuverte, setModalOuverte] = useState(false)
  const [form, setForm] = useState(formVide)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)      // culture.id en attente de confirmation
  const [choixItId, setChoixItId] = useState(null)       // culture.id qui a besoin d'un itinéraire

  // Utiliser les props si disponibles, sinon fetch local
  const cultures = culturesProp || culturesLocal
  const legumesRef = legumesRefProp || legumesRefLocal

  useEffect(() => {
    if (session && !culturesProp) fetchCultures()
    if (session && !legumesRefProp) fetchLegumes()
  }, [session])

  const fetchLegumes = async () => {
    const { data } = await supabase.from('legumes_ref').select('id, slug, nom').order('nom')
    if (data) setLegumesRefLocal(data)
  }

  const fetchCultures = async () => {
    const { data } = await supabase.from('cultures').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data) setCulturesLocal(data)
  }

  const conseils = useMemo(
    () => getConseilsJour(profile, cultures, legumesRef),
    [profile, cultures, legumesRef]
  )

  const ouvrir = () => { setForm(formVide); setModalOuverte(true) }
  const fermer = () => { setModalOuverte(false) }
  const handleChange = (champ, valeur) => { setForm(prev => ({ ...prev, [champ]: valeur })) }

  const getStatutSuivant = (culture) => {
    const progression = PROGRESSIONS[culture.itineraire]
    if (!progression) return null
    const idx = progression.indexOf(culture.statut)
    if (idx === -1 || idx >= progression.length - 1) return null
    return progression[idx + 1]
  }

  const handleBadgeClick = (culture) => {
    if (culture.statut === 'termine') return
    if (!culture.itineraire) {
      setChoixItId(culture.id)
      setConfirmId(null)
      return
    }
    const suivant = getStatutSuivant(culture)
    if (!suivant) return
    setConfirmId(culture.id)
    setChoixItId(null)
  }

  const confirmerProgression = async (culture) => {
    const suivant = getStatutSuivant(culture)
    if (!suivant) return
    const updates = { statut: suivant }
    if (STATUTS_SEMIS.includes(suivant)) {
      updates.date_semis = new Date().toISOString().split('T')[0]
    }
    if (suivant === 'plante') {
      updates.date_plantation = new Date().toISOString().split('T')[0]
    }
    await supabase.from('cultures').update(updates).eq('id', culture.id)
    if (onCultureChanged) onCultureChanged()
    else setCulturesLocal(prev => prev.map(c => c.id === culture.id ? { ...c, ...updates } : c))
    setConfirmId(null)
  }

  const assignerItineraire = async (cultureId, itId) => {
    const progression = PROGRESSIONS[itId]
    const statutActuel = cultures.find(c => c.id === cultureId)?.statut
    // Si le statut actuel n'est pas dans la progression, on le met au premier
    const statut = progression.includes(statutActuel) ? statutActuel : progression[0]
    await supabase.from('cultures').update({ itineraire: itId, statut }).eq('id', cultureId)
    if (onCultureChanged) onCultureChanged()
    else setCulturesLocal(prev => prev.map(c => c.id === cultureId ? { ...c, itineraire: itId, statut } : c))
    setChoixItId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.legume || !form.itineraire) return
    const itConfig = ITINERAIRES_CARTES.find(it => it.id === form.itineraire)
    setSaving(true)
    const { data, error } = await supabase
      .from('cultures')
      .insert({
        user_id: session.user.id,
        legume: form.legume,
        legume_ref_id: form.legume_ref_id,
        variete: form.variete || null,
        statut: itConfig.statutInitial,
        itineraire: form.itineraire,
        date_semis: form.date_semis || null,
        notes: form.notes || null,
        nb_semis: form.nb_semis,
        intervalle_semis_semaines: form.nb_semis > 1 ? form.intervalle_semis_semaines : null,
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      if (onCultureChanged) onCultureChanged()
      else setCulturesLocal(prev => [data, ...prev])
      fermer()
    }
  }

  const statutInfo = (val) => ({
    label: LABELS_STATUTS[val] || val,
    color: COULEURS_STATUTS[val] || '#888',
  })

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
    color: '#e8f5e8', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { color: '#a8d5a2', fontSize: 15, marginBottom: 4, display: 'block' }

  const sectionStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(109,191,109,0.15)',
    borderRadius: 14, padding: '16px 18px', marginBottom: 14,
    textAlign: 'left',
  }
  const sectionTitleStyle = {
    fontSize: 22, fontWeight: 'bold', color: '#e8f5e8',
    fontFamily: 'Amaranth, sans-serif',
    margin: '24px 0 16px',
  }
  const itemStyle = {
    display: 'flex', alignItems: 'baseline', gap: 8,
    textAlign: 'left', fontSize: 16, color: '#e8f5e8', lineHeight: 1.6, padding: '4px 0',
    borderBottom: '1px solid rgba(109,191,109,0.08)',
  }
  const puceStyle = { color: '#6dbf6d', fontWeight: 'bold', fontSize: 18, flexShrink: 0 }
  const legumeTitleStyle = {
    fontSize: 18, color: '#6dbf6d', fontWeight: 'bold',
    background: 'rgba(109,191,109,0.1)',
    padding: '6px 12px', borderRadius: 8, marginBottom: 8,
  }

  const hasCultures = cultures.length > 0
  const hasConseils = conseils.taches_urgentes.length > 0
    || conseils.recoltes_prochaines.length > 0
    || conseils.successions_possibles?.length > 0
    || conseils.associations?.length > 0
    || conseils.alertes.length > 0

  return (
    <div style={{ padding: 20, fontFamily: 'Amaranth, sans-serif' }}>
      {/* ── PARTIE HAUTE : Mes cultures ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#e8f5e8', fontSize: 22, fontWeight: 'bold', fontFamily: 'Amaranth, sans-serif', margin: 0 }}>Mes cultures</h2>
        <button onClick={ouvrir} style={{
          padding: '10px 18px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
          border: 'none', borderRadius: 12, color: '#fff', fontSize: 16,
          cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
        }}>
          + Ajouter une culture
        </button>
      </div>

      {!hasCultures ? (
        <p style={{ color: '#6dbf6d', fontSize: 16 }}>
          Aucune culture pour l'instant. Ajoute ta première !
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cultures.map(c => {
            const st = statutInfo(c.statut)
            const estTermine = c.statut === 'termine'
            const suivant = c.itineraire ? getStatutSuivant(c) : null
            const cliquable = !estTermine

            return (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(109,191,109,0.15)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#e8f5e8', fontSize: 18, fontWeight: 'bold' }}>
                    {c.legume}{c.variete ? ` – ${c.variete}` : ''}
                  </span>
                  <span
                    onClick={() => cliquable && handleBadgeClick(c)}
                    style={{
                      background: st.color + '22', color: st.color,
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 'bold',
                      cursor: cliquable ? 'pointer' : 'default',
                      transition: 'filter 0.15s',
                    }}
                    onMouseEnter={e => cliquable && (e.currentTarget.style.filter = 'brightness(1.3)')}
                    onMouseLeave={e => cliquable && (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    {estTermine ? '✓ Terminé' : `${st.label} →`}
                  </span>
                </div>
                <div style={{ color: '#a8d5a2', fontSize: 12 }}>
                  {(!c.date_semis || c.date_semis === '1970-01-01') ? 'Semis : à planifier' : 'Semis : ' + new Date(c.date_semis).toLocaleDateString('fr-FR')}
                </div>
                {c.notes && (
                  <div style={{ color: '#7daa7d', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>{c.notes}</div>
                )}

                {/* Confirmation de progression */}
                {confirmId === c.id && suivant && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px',
                    background: 'rgba(109,191,109,0.08)',
                    border: '1px solid rgba(109,191,109,0.25)',
                    borderRadius: 10,
                  }}>
                    <div style={{ color: '#e8f5e8', fontSize: 14, marginBottom: 8 }}>
                      Passer à : <strong style={{ color: '#6dbf6d' }}>{LABELS_STATUTS[suivant]}</strong> ?
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => confirmerProgression(c)}
                        style={{
                          padding: '6px 14px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                          border: 'none', borderRadius: 8, color: '#fff', fontSize: 13,
                          cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                        }}
                      >✓ Confirmer</button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{
                          padding: '6px 14px', background: 'transparent',
                          border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8,
                          color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                        }}
                      >✗ Annuler</button>
                    </div>
                  </div>
                )}

                {/* Choix d'itinéraire pour cultures anciennes */}
                {choixItId === c.id && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px',
                    background: 'rgba(109,191,109,0.08)',
                    border: '1px solid rgba(109,191,109,0.25)',
                    borderRadius: 10,
                  }}>
                    <div style={{ color: '#e8f5e8', fontSize: 14, marginBottom: 10 }}>
                      Quel est ton itinéraire pour ce légume ?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ITINERAIRES_CARTES.map(it => (
                        <div
                          key={it.id}
                          onClick={() => assignerItineraire(c.id, it.id)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(109,191,109,0.2)',
                            borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                          }}
                        >
                          <div style={{ color: '#e8f5e8', fontSize: 14, fontWeight: 'bold' }}>{it.emoji} {it.titre}</div>
                          <div style={{ color: '#a8d5a2', fontSize: 12 }}>{it.desc}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setChoixItId(null)}
                      style={{
                        marginTop: 8, padding: '6px 14px', background: 'transparent',
                        border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8,
                        color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
                      }}
                    >✗ Annuler</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── PARTIE BASSE : Conseils du jour ── */}
      {!hasCultures ? null : !hasConseils ? (
        <div style={{ color: '#6dbf6d', fontSize: 15, fontStyle: 'italic', textAlign: 'center', padding: 20, marginTop: 32 }}>
          Rien de particulier aujourd'hui, ton jardin se porte bien !
        </div>
      ) : (
        <div style={{ marginTop: 32 }}>
          {/* 1. Tâches cette semaine */}
          {conseils.taches_urgentes.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Tâches cette semaine</div>
              {groupByLegume(conseils.taches_urgentes, t => t.legume + (t.variete ? ' – ' + t.variete : '')).map(([legume, taches], gi) => (
                <div key={gi} style={{ marginBottom: 12 }}>
                  <div style={legumeTitleStyle}>{getEmoji(taches[0].legume)} {legume}</div>
                  {taches.map((t, i) => (
                    <div key={i} style={itemStyle}>
                      <span style={puceStyle}>›</span>
                      <span style={{ color: '#e8f5e8' }}>{t.tache}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 2. Récoltes à surveiller */}
          {conseils.recoltes_prochaines.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Récoltes à surveiller</div>
              {conseils.recoltes_prochaines.map((r, i) => (
                <div key={i} style={itemStyle}>
                  <span style={{ ...puceStyle, color: '#f0a500' }}>›</span>
                  <span style={{ color: '#e8f5e8' }}>
                    {getEmoji(r.legume)} <span style={{ fontWeight: 'bold' }}>{r.legume}{r.variete ? ' – ' + r.variete : ''}</span>
                    <span style={{ color: '#f0a500' }}>
                      {r.jours_restants === 0 ? ' — prêt à récolter !' : ` — dans ${r.jours_restants} jour${r.jours_restants > 1 ? 's' : ''}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Associations possibles */}
          {conseils.associations?.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Associations possibles</div>
              {conseils.associations.map((a, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={legumeTitleStyle}>{getEmoji(a.legume)} {a.legume}{a.variete ? ' – ' + a.variete : ''}</div>
                  {a.benefiques.length > 0 && (
                    <div style={itemStyle}>
                      <span style={{ ...puceStyle, color: '#6dbf6d' }}>✅</span>
                      <span style={{ color: '#e8f5e8' }}>Plante à côté : {a.benefiques.join(', ')}</span>
                    </div>
                  )}
                  {a.eviter.length > 0 && (
                    <div style={itemStyle}>
                      <span style={{ ...puceStyle, color: '#e6a835' }}>❌</span>
                      <span style={{ color: '#e8f5e8' }}>Évite à proximité : {a.eviter.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 4. Successions possibles */}
          {conseils.successions_possibles?.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Successions possibles</div>
              {conseils.successions_possibles.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={legumeTitleStyle}>{getEmoji(s.apres)} {s.apres}{s.variete ? ' – ' + s.variete : ''}</div>
                  <div style={itemStyle}>
                    <span style={puceStyle}>›</span>
                    <span style={{ color: '#e8f5e8' }}>
                      {s.imminente
                        ? `Prêts dans ${s.jours_restants} jour${s.jours_restants > 1 ? 's' : ''} : pense à prévoir ${s.suggestions.join(', ')}`
                        : s.info
                          ? `Après la récolte, enchaîne avec ${s.suggestions.join(', ')}`
                          : `Tu peux planter ${s.suggestions.join(', ')}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Alertes */}
          {conseils.alertes.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ ...sectionTitleStyle, color: '#f0a500' }}>Alertes</div>
              {conseils.alertes.map((a, i) => (
                <div key={i} style={itemStyle}>
                  <span style={{ ...puceStyle, color: '#f0a500' }}>›</span>
                  <span style={{ color: '#f0a500' }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Nouvelle culture ── */}
      {modalOuverte && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }} onClick={fermer}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{
              background: '#1a2e1a', border: '1px solid rgba(109,191,109,0.25)',
              borderRadius: 16, padding: 24, width: '100%', maxWidth: 400,
              fontFamily: 'Amaranth, sans-serif', maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <h3 style={{ color: '#e8f5e8', fontSize: 18, margin: '0 0 20px' }}>Nouvelle culture</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Légume *</label>
              <LegumeSearch
                value={form.legume_ref_id}
                onChange={v => {
                  const leg = legumesRef.find(l => l.id === v)
                  const nom = leg ? leg.nom : ''
                  const conseilData = CONSEILS_ECHELONNEMENT[nom]
                  const itSuggere = ITINERAIRES_SUGGERES[nom] || null
                  setForm(prev => ({ ...prev, legume_ref_id: v, legume: nom, intervalle_semis_semaines: conseilData?.intervalle || 2, itineraire: itSuggere }))
                }}
                placeholder="Rechercher un légume..."
                options={legumesRef.map(l => ({ value: l.id, label: l.nom }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Variété</label>
              <input type="text" placeholder="Ex : Coeur de boeuf" value={form.variete} onChange={e => handleChange('variete', e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Comment allez-vous démarrer ? *</label>
              {form.legume && ITINERAIRES_SUGGERES[form.legume] && (
                <div style={{ fontSize: 13, fontStyle: 'italic', color: '#a8d5a2', marginBottom: 12 }}>
                  {'💡 L\'itinéraire conseillé pour ' + form.legume + ' est pré-sélectionné. Tu peux le modifier si besoin.'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ITINERAIRES_CARTES.map(it => (
                  <div
                    key={it.id}
                    onClick={() => handleChange('itineraire', it.id)}
                    style={{
                      background: form.itineraire === it.id ? 'rgba(109,191,109,0.1)' : 'rgba(255,255,255,0.03)',
                      border: form.itineraire === it.id ? '1px solid #6dbf6d' : '1px solid rgba(109,191,109,0.2)',
                      borderRadius: 12, padding: 14, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ color: '#e8f5e8', fontSize: 15, fontWeight: 'bold' }}>
                      {it.emoji} {it.titre}
                    </div>
                    <div style={{ color: '#a8d5a2', fontSize: 13, marginTop: 4 }}>
                      {it.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Date de semis</label>
              <input type="date" value={form.date_semis} onChange={e => handleChange('date_semis', e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Combien de semis successifs ?</label>
              <input type="number" min={1} max={6} value={form.nb_semis} onChange={e => handleChange('nb_semis', Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))} style={inputStyle} />
            </div>

            {form.nb_semis > 1 && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Intervalle entre les semis</label>
                <CustomSelect
                  value={form.intervalle_semis_semaines}
                  onChange={v => handleChange('intervalle_semis_semaines', v)}
                  options={[
                    { value: 1, label: '1 semaine' },
                    { value: 2, label: '2 semaines' },
                    { value: 3, label: '3 semaines' },
                    { value: 4, label: '4 semaines' },
                  ]}
                />
                <div style={{ color: '#a8d5a2', fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 1.4 }}>
                  {'💡 ' + (CONSEILS_ECHELONNEMENT[form.legume]?.conseil || CONSEIL_DEFAUT)}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes</label>
              <textarea placeholder="Notes libres..." value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={fermer} style={{
                flex: 1, padding: '12px', background: 'transparent',
                border: '1px solid rgba(109,191,109,0.3)', borderRadius: 12,
                color: '#a8d5a2', fontSize: 16, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
              }}>Annuler</button>
              <button type="submit" disabled={saving || !form.itineraire} style={{
                flex: 1, padding: '12px',
                background: (saving || !form.itineraire) ? '#3a5a3a' : 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: 16,
                cursor: (saving || !form.itineraire) ? 'not-allowed' : 'pointer', fontFamily: 'Amaranth, sans-serif',
                opacity: !form.itineraire ? 0.5 : 1,
              }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
