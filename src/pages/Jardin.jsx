import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getConseilsJour, getZone } from '../lib/conseils'
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
  'recolte': '#e88888',
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
  { value: 'recolte', label: 'En récolte', color: '#e88888' },
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

const INCIDENT_TYPES = [
  { value: 'gel', emoji: '🧊', label: 'Gel' },
  { value: 'grele', emoji: '🌩️', label: 'Grêle' },
  { value: 'ravageurs', emoji: '🐛', label: 'Ravageurs' },
  { value: 'maladie', emoji: '🍄', label: 'Maladie' },
  { value: 'secheresse', emoji: '🌵', label: 'Sécheresse' },
  { value: 'inondation', emoji: '🌊', label: 'Inondation' },
  { value: 'autre', emoji: '❓', label: 'Autre' },
]

const formVide = { legume: '', legume_ref_id: null, variete: '', itineraire: null, date_semis: '', notes: '', nb_semis: 1, intervalle_semis_semaines: 2 }

export default function Jardin({ profile, session, cultures: culturesProp, legumesRef: legumesRefProp, onCultureChanged }) {
  const [culturesLocal, setCulturesLocal] = useState([])
  const [legumesRefLocal, setLegumesRefLocal] = useState([])
  const [modalOuverte, setModalOuverte] = useState(false)
  const [form, setForm] = useState(formVide)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)      // culture.id en attente de confirmation
  const [confirmDate, setConfirmDate] = useState('')    // date pour la progression
  const [choixItId, setChoixItId] = useState(null)       // culture.id qui a besoin d'un itinéraire
  const [incidentId, setIncidentId] = useState(null)     // culture.id pour formulaire incident
  const [incidentForm, setIncidentForm] = useState({ type: null, note: '', perte_pourcentage: 0 })
  const [incidentSaving, setIncidentSaving] = useState(false)
  const [recolteFinId, setRecolteFinId] = useState(null) // culture.id pour confirmation récolte terminée
  const [recolteFinNote, setRecolteFinNote] = useState('')
  const [recolteFinSaving, setRecolteFinSaving] = useState(false)
  const [onboardingSeen, setOnboardingSeen] = useState(() => localStorage.getItem('onboarding_seen') === 'true')
  const [incidents, setIncidents] = useState([])

  // Utiliser les props si disponibles, sinon fetch local
  const cultures = culturesProp || culturesLocal
  const legumesRef = legumesRefProp || legumesRefLocal

  useEffect(() => {
    if (session && !culturesProp) fetchCultures()
    if (session && !legumesRefProp) fetchLegumes()
  }, [session])

  useEffect(() => {
    if (session) fetchIncidents()
  }, [session, culturesProp])

  const fetchIncidents = async () => {
    const { data } = await supabase.from('incidents').select('id, culture_id').eq('user_id', session.user.id)
    if (data) setIncidents(data)
  }

  const hasIncident = (cultureId) => incidents.some(i => i.culture_id === cultureId)

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
    setConfirmDate(new Date().toISOString().split('T')[0])
    setChoixItId(null)
  }

  const confirmerProgression = async (culture) => {
    const suivant = getStatutSuivant(culture)
    if (!suivant) return
    const dateChoisie = confirmDate || new Date().toISOString().split('T')[0]
    const updates = { statut: suivant }
    if (STATUTS_SEMIS.includes(suivant)) {
      updates.date_semis = dateChoisie
    }
    if (suivant === 'plante') {
      updates.date_plantation = dateChoisie
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

  const ouvrirIncident = (cultureId) => {
    setIncidentId(cultureId)
    setIncidentForm({ type: null, note: '', perte_pourcentage: 0 })
    setConfirmId(null)
    setChoixItId(null)
    setRecolteFinId(null)
  }

  const enregistrerIncident = async (culture) => {
    if (!incidentForm.type) return
    setIncidentSaving(true)
    await supabase.from('incidents').insert({
      culture_id: culture.id,
      user_id: session.user.id,
      type: incidentForm.type,
      note: incidentForm.note || null,
      perte_pourcentage: incidentForm.perte_pourcentage,
    })
    if (incidentForm.perte_pourcentage === 100) {
      await supabase.from('cultures').update({ statut: 'termine' }).eq('id', culture.id)
    }
    setIncidentSaving(false)
    setIncidentId(null)
    fetchIncidents()
    if (onCultureChanged) onCultureChanged()
    else fetchCultures()
  }

  const ouvrirRecolteFin = (cultureId) => {
    setRecolteFinId(cultureId)
    setRecolteFinNote('')
    setConfirmId(null)
    setChoixItId(null)
    setIncidentId(null)
  }

  const confirmerRecolteFin = async (culture) => {
    setRecolteFinSaving(true)
    await supabase.from('cultures').update({ statut: 'termine' }).eq('id', culture.id)
    await supabase.from('incidents').insert({
      culture_id: culture.id,
      user_id: session.user.id,
      type: 'recolte_terminee',
      note: recolteFinNote || null,
      perte_pourcentage: 0,
    })
    setRecolteFinSaving(false)
    setRecolteFinId(null)
    fetchIncidents()
    if (onCultureChanged) onCultureChanged()
    else fetchCultures()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.legume || !form.itineraire) return
    const itConfig = ITINERAIRES_CARTES.find(it => it.id === form.itineraire)
    setSaving(true)

    const nbSemis = form.nb_semis || 1
    const groupeId = nbSemis > 1 ? crypto.randomUUID() : null
    const intervalle = form.intervalle_semis_semaines || 2

    // Calculer la date de base : saisie utilisateur ou auto depuis legumes_ref
    let dateSemisBase = form.date_semis ? new Date(form.date_semis) : null
    if (!dateSemisBase && form.legume_ref_id) {
      const refLeg = legumesRef.find(l => l.id === form.legume_ref_id)
      if (refLeg) {
        const zone = getZone(profile)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const year = now.getFullYear()
        // Chercher la première fenêtre de semis ouverte
        for (const prefixe of ['semis_abri', 'semis_terre']) {
          const debut = refLeg[`${prefixe}_${zone}_debut`]
          if (debut) {
            const [mm, dd] = debut.split('-').map(Number)
            const d = new Date(year, mm - 1, dd)
            dateSemisBase = d > now ? d : now
            break
          }
        }
        if (!dateSemisBase) dateSemisBase = now
      }
    }

    let lastData = null
    let lastError = null
    for (let i = 0; i < nbSemis; i++) {
      let dateSemisPrevue = new Date(dateSemisBase)
      dateSemisPrevue.setDate(dateSemisPrevue.getDate() + i * intervalle * 7)
      const payload = {
        user_id: session.user.id,
        legume: form.legume,
        legume_ref_id: form.legume_ref_id,
        variete: form.variete || null,
        statut: itConfig.statutInitial,
        itineraire: form.itineraire,
        date_semis: dateSemisPrevue ? dateSemisPrevue.toISOString().split('T')[0] : null,
        notes: form.notes || null,
        nb_semis: 1,
        groupe_id: groupeId,
        numero_semis: i + 1,
        total_semis: nbSemis,
      }
      console.log(`[handleSubmit] Semis ${i + 1}/${nbSemis} — payload:`, payload)
      const { data, error } = await supabase
        .from('cultures')
        .insert(payload)
        .select()
        .single()
      if (error) {
        console.error('[handleSubmit] Erreur Supabase:', error)
        console.error('[handleSubmit] Message:', error.message)
        console.error('[handleSubmit] Details:', error.details)
        console.error('[handleSubmit] Hint:', error.hint)
        console.error('[handleSubmit] Code:', error.code)
      } else {
        console.log('[handleSubmit] Succès:', data)
      }
      lastData = data
      lastError = error
    }

    setSaving(false)
    if (!lastError && lastData) {
      if (onCultureChanged) onCultureChanged()
      else fetchCultures()
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

  const renderBadge = (c, st, estTermine, cliquable) => (
    <span
      onClick={() => cliquable && handleBadgeClick(c)}
      title={cliquable ? 'Cliquez pour faire évoluer' : undefined}
      style={{
        background: st.color + '22', color: st.color,
        fontSize: 13, padding: '3px 10px', borderRadius: 20, fontWeight: 'bold',
        cursor: cliquable ? 'pointer' : 'default',
        transition: 'filter 0.15s',
      }}
      onMouseEnter={e => cliquable && (e.currentTarget.style.filter = 'brightness(1.3)')}
      onMouseLeave={e => cliquable && (e.currentTarget.style.filter = 'brightness(1)')}
    >
      {estTermine ? '✓ Terminé' : `${st.label} →`}
    </span>
  )

  const renderCarteActions = (c, estTermine, suivant) => (
    <>
      {c.notes && (
        <div style={{ color: '#7daa7d', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>{c.notes}</div>
      )}
      {!estTermine && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span
            onClick={() => ouvrirIncident(c.id)}
            style={hasIncident(c.id) ? {
              fontSize: 14, cursor: 'pointer', color: '#e88888',
              background: 'rgba(255,120,80,0.15)', border: '1px solid #c45555',
              borderRadius: 8, padding: '4px 10px',
              fontFamily: 'Amaranth, sans-serif', fontWeight: 'bold',
              transition: 'filter 0.15s',
            } : {
              fontSize: 14, cursor: 'pointer', color: '#7ab8d4',
              background: 'rgba(74,127,165,0.15)', border: '1px solid #4a7fa5',
              borderRadius: 8, padding: '4px 10px',
              fontFamily: 'Amaranth, sans-serif', fontWeight: 'bold',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >{hasIncident(c.id) ? '⚠️ Incident' : '⚠️ Incident ?'}</span>
          {c.statut === 'recolte' && (
            <span
              onClick={() => ouvrirRecolteFin(c.id)}
              style={{
                fontSize: 14, cursor: 'pointer', color: '#e88888',
                background: 'rgba(180,50,50,0.15)', border: '1px solid #c45555',
                padding: '4px 10px', borderRadius: 8, fontWeight: 'bold',
                fontFamily: 'Amaranth, sans-serif',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >🧺 Récolte terminée ?</span>
          )}
        </div>
      )}
      {incidentId === c.id && (
        <div style={{
          marginTop: 10, padding: '12px 14px',
          background: 'rgba(240,165,0,0.06)',
          border: '1px solid rgba(240,165,0,0.25)',
          borderRadius: 10,
        }}>
          <div style={{ color: '#f0a500', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>
            ⚠️ Signaler un incident
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {INCIDENT_TYPES.map(t => (
              <span
                key={t.value}
                onClick={() => setIncidentForm(prev => ({ ...prev, type: t.value }))}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: incidentForm.type === t.value ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)',
                  border: incidentForm.type === t.value ? '1px solid #f0a500' : '1px solid rgba(109,191,109,0.15)',
                  color: incidentForm.type === t.value ? '#f0a500' : '#a8d5a2',
                  fontFamily: 'Amaranth, sans-serif',
                }}
              >{t.emoji} {t.label}</span>
            ))}
          </div>
          <input type="text" placeholder="Précise si besoin..." value={incidentForm.note}
            onChange={e => setIncidentForm(prev => ({ ...prev, note: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 10, fontSize: 14 }}
          />
          <div style={{ marginBottom: 6 }}>
            <label style={{ color: '#a8d5a2', fontSize: 13 }}>
              Perte estimée : <strong style={{ color: '#e8f5e8' }}>{incidentForm.perte_pourcentage}%</strong>
            </label>
            <input type="range" min={0} max={100} step={5} value={incidentForm.perte_pourcentage}
              onChange={e => setIncidentForm(prev => ({ ...prev, perte_pourcentage: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#6dbf6d', marginTop: 4 }}
            />
          </div>
          <div style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 10, color: incidentForm.perte_pourcentage === 100 ? '#f0a500' : '#6dbf6d' }}>
            {incidentForm.perte_pourcentage === 100 ? '⚠️ Perte totale — cette culture sera clôturée' : 'La culture reste active'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => enregistrerIncident(c)} disabled={!incidentForm.type || incidentSaving}
              style={{ padding: '6px 14px', background: (!incidentForm.type || incidentSaving) ? '#3a5a3a' : 'linear-gradient(135deg, #4a7c4a, #6dbf6d)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: (!incidentForm.type || incidentSaving) ? 'not-allowed' : 'pointer', fontFamily: 'Amaranth, sans-serif', opacity: !incidentForm.type ? 0.5 : 1 }}
            >{incidentSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
            <button onClick={() => setIncidentId(null)}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8, color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif' }}
            >Annuler</button>
          </div>
        </div>
      )}
      {recolteFinId === c.id && (
        <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(135,63,95,0.08)', border: '1px solid rgba(135,63,95,0.25)', borderRadius: 10 }}>
          <div style={{ color: '#e8f5e8', fontSize: 14, marginBottom: 8 }}>
            🧺 Confirmer la fin de récolte de tes <strong style={{ color: '#873f5f' }}>{c.legume}</strong> ?
          </div>
          <input type="text" placeholder="Une dernière remarque ?" value={recolteFinNote} onChange={e => setRecolteFinNote(e.target.value)} style={{ ...inputStyle, marginBottom: 10, fontSize: 14 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => confirmerRecolteFin(c)} disabled={recolteFinSaving}
              style={{ padding: '6px 14px', background: recolteFinSaving ? '#3a5a3a' : 'linear-gradient(135deg, #4a7c4a, #6dbf6d)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: recolteFinSaving ? 'not-allowed' : 'pointer', fontFamily: 'Amaranth, sans-serif' }}
            >✓ Confirmer</button>
            <button onClick={() => setRecolteFinId(null)}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8, color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif' }}
            >Annuler</button>
          </div>
        </div>
      )}
      {confirmId === c.id && suivant && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(109,191,109,0.08)', border: '1px solid rgba(109,191,109,0.25)', borderRadius: 10 }}>
          <div style={{ color: '#e8f5e8', fontSize: 14, marginBottom: 8 }}>
            Passer à : <strong style={{ color: '#6dbf6d' }}>{LABELS_STATUTS[suivant]}</strong> ?
          </div>
          {(STATUTS_SEMIS.includes(suivant) || suivant === 'plante') && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ color: '#a8d5a2', fontSize: 13, display: 'block', marginBottom: 4 }}>
                {suivant === 'plante' ? 'Date de plantation' : 'Date de semis'}
              </label>
              <input type="date" value={confirmDate} onChange={e => setConfirmDate(e.target.value)}
                style={{ ...inputStyle, fontSize: 14, padding: '6px 10px' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => confirmerProgression(c)} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif' }}>✓ Confirmer</button>
            <button onClick={() => setConfirmId(null)} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8, color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif' }}>✗ Annuler</button>
          </div>
        </div>
      )}
      {choixItId === c.id && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(109,191,109,0.08)', border: '1px solid rgba(109,191,109,0.25)', borderRadius: 10 }}>
          <div style={{ color: '#e8f5e8', fontSize: 14, marginBottom: 10 }}>Quel est ton itinéraire pour ce légume ?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ITINERAIRES_CARTES.map(it => (
              <div key={it.id} onClick={() => assignerItineraire(c.id, it.id)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(109,191,109,0.2)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ color: '#e8f5e8', fontSize: 14, fontWeight: 'bold' }}>{it.emoji} {it.titre}</div>
                <div style={{ color: '#a8d5a2', fontSize: 12 }}>{it.desc}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setChoixItId(null)} style={{ marginTop: 8, padding: '6px 14px', background: 'transparent', border: '1px solid rgba(109,191,109,0.3)', borderRadius: 8, color: '#a8d5a2', fontSize: 13, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif' }}>✗ Annuler</button>
        </div>
      )}
    </>
  )

  const labelDate = (c) => {
    if ((c.statut === 'a_semer' || c.statut === 'a_planter') && c.date_semis && c.date_semis !== '1970-01-01') {
      const d = new Date(c.date_semis)
      const now = new Date(); now.setHours(0, 0, 0, 0)
      if (d < now) return { text: '⚠️ Statut à mettre à jour', color: '#f0a500' }
    }
    const text = (() => {
      switch (c.statut) {
        case 'a_semer': case 'a_planter': return 'Prévu le'
        case 'seme_abri_plateau': case 'seme_abri_godet': case 'seme_place': return 'Semé le'
        case 'plante': return 'Planté le'
        case 'recolte': return 'En récolte depuis le'
        case 'termine': return 'Terminé le'
        default: return 'Date'
      }
    })()
    return { text, color: null }
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

      {/* Bandeau d'onboarding */}
      {!onboardingSeen && hasCultures && (
        <div style={{
          background: 'rgba(109,191,109,0.1)',
          border: '1px solid rgba(109,191,109,0.3)',
          borderRadius: 10, padding: 12, marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ color: '#a8d5a2', fontSize: 14, fontFamily: 'Amaranth, sans-serif', textAlign: 'left' }}>
            <div style={{ marginBottom: 6 }}>
              Clique sur le statut
              <span style={{
                background: '#f0a50022', color: '#f0a500',
                fontSize: 13, padding: '3px 10px', borderRadius: 20, fontWeight: 'bold',
                marginLeft: 6, marginRight: 6, display: 'inline-block',
              }}>À semer →</span>
              d'une culture pour le faire évoluer.
            </div>
            <div>
              Utilise
              <span style={{
                fontSize: 14, color: '#7ab8d4',
                background: 'rgba(74,127,165,0.15)', border: '1px solid #4a7fa5',
                borderRadius: 8, padding: '2px 8px', fontWeight: 'bold',
                marginLeft: 6, marginRight: 4, display: 'inline-block',
              }}>⚠️ Incident ?</span>
              pour signaler un problème ou une perte.
            </div>
          </div>
          <button
            onClick={() => { localStorage.setItem('onboarding_seen', 'true'); setOnboardingSeen(true) }}
            style={{
              padding: '4px 12px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 13,
              cursor: 'pointer', fontFamily: 'Amaranth, sans-serif', flexShrink: 0,
            }}
          >✓ Compris</button>
        </div>
      )}

      {!hasCultures ? (
        <p style={{ color: '#6dbf6d', fontSize: 16 }}>
          Aucune culture pour l'instant. Ajoute ta première !
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(() => {
            // Grouper les cultures par groupe_id
            const groupes = []
            const seen = new Set()
            for (const c of cultures) {
              if (seen.has(c.id)) continue
              if (c.groupe_id) {
                if (seen.has(c.groupe_id)) continue
                seen.add(c.groupe_id)
                const membres = cultures.filter(x => x.groupe_id === c.groupe_id).sort((a, b) => (a.numero_semis || 1) - (b.numero_semis || 1))
                membres.forEach(m => seen.add(m.id))
                groupes.push({ type: 'groupe', groupe_id: c.groupe_id, membres })
              } else {
                seen.add(c.id)
                groupes.push({ type: 'solo', culture: c })
              }
            }
            return groupes.map(g => {
              if (g.type === 'groupe') {
                const premier = g.membres[0]
                return (
                  <div key={g.groupe_id}>
                    <div style={{
                      fontSize: 18, fontWeight: 'bold', color: '#e8f5e8',
                      fontFamily: 'Amaranth, sans-serif', marginBottom: 8,
                    }}>
                      {getEmoji(premier.legume)} {premier.legume}{premier.variete ? ` – ${premier.variete}` : ''} — {premier.total_semis || g.membres.length} semis échelonnés
                    </div>
                    {g.membres.map((c, idx) => {
                      const st = statutInfo(c.statut)
                      const estTermine = c.statut === 'termine'
                      const suivant = c.itineraire ? getStatutSuivant(c) : null
                      const cliquable = !estTermine
                      return (
                        <div key={c.id} style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(109,191,109,0.15)',
                          borderRadius: 12, padding: '12px 16px', marginLeft: 16,
                          marginBottom: idx < g.membres.length - 1 ? 4 : 0,
                          borderTop: idx > 0 ? '1px solid rgba(109,191,109,0.08)' : undefined,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: '#a8d5a2', fontSize: 15, fontWeight: 'bold' }}>
                              Semis {c.numero_semis || (idx + 1)}/{c.total_semis || g.membres.length}
                            </span>
                            {renderBadge(c, st, estTermine, cliquable)}
                          </div>
                          <div style={{ color: '#a8d5a2', fontSize: 12 }}>
                            {(() => { const ld = labelDate(c); const dateStr = (!c.date_semis || c.date_semis === '1970-01-01') ? 'à planifier' : new Date(c.date_semis).toLocaleDateString('fr-FR'); return <span style={ld.color ? { color: ld.color } : undefined}>{ld.text} : {dateStr}</span> })()}
                          </div>
                          {renderCarteActions(c, estTermine, suivant)}
                        </div>
                      )
                    })}
                  </div>
                )
              }
              // Solo
              const c = g.culture
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
                    {renderBadge(c, st, estTermine, cliquable)}
                </div>
                <div style={{ color: '#a8d5a2', fontSize: 12 }}>
                  {(() => { const ld = labelDate(c); const dateStr = (!c.date_semis || c.date_semis === '1970-01-01') ? 'à planifier' : new Date(c.date_semis).toLocaleDateString('fr-FR'); return <span style={ld.color ? { color: ld.color } : undefined}>{ld.text} : {dateStr}</span> })()}
                </div>
                {renderCarteActions(c, estTermine, suivant)}
              </div>
              )
            })
          })()}
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
