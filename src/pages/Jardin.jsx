import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import LegumeSearch from '../components/ui/LegumeSearch'

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

const STATUTS = [
  { value: 'a_semer', label: 'À semer', color: '#c4a95a' },
  { value: 'en_godets', label: 'En godets / plateaux', color: '#5aafc4' },
  { value: 'en_place', label: 'En place / planté', color: '#6dbf6d' },
  { value: 'recolte', label: 'En récolte', color: '#e6a835' },
  { value: 'termine', label: 'Terminé', color: '#888888' },
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

const formVide = { legume: '', legume_ref_id: null, variete: '', statut: 'a_semer', date_semis: '', notes: '', nb_semis: 1, intervalle_semis_semaines: 2 }

export default function Jardin({ profile, session }) {
  const [cultures, setCultures] = useState([])
  const [legumesRef, setLegumesRef] = useState([])
  const [modalOuverte, setModalOuverte] = useState(false)
  const [form, setForm] = useState(formVide)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      fetchCultures()
      fetchLegumes()
    }
  }, [session])

  const fetchLegumes = async () => {
    const { data } = await supabase
      .from('legumes_ref')
      .select('id, slug, nom')
      .order('nom')
    if (data) setLegumesRef(data)
  }

  const fetchCultures = async () => {
    const { data } = await supabase
      .from('cultures')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setCultures(data)
  }

  const ouvrir = () => {
    setForm(formVide)
    setModalOuverte(true)
  }

  const fermer = () => {
    setModalOuverte(false)
  }

  const handleChange = (champ, valeur) => {
    setForm(prev => ({ ...prev, [champ]: valeur }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.legume) return
    setSaving(true)
    const { data, error } = await supabase
      .from('cultures')
      .insert({
        user_id: session.user.id,
        legume: form.legume,
        legume_ref_id: form.legume_ref_id,
        variete: form.variete || null,
        statut: form.statut,
        date_semis: form.date_semis || null,
        notes: form.notes || null,
        nb_semis: form.nb_semis,
        intervalle_semis_semaines: form.nb_semis > 1 ? form.intervalle_semis_semaines : null,
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setCultures(prev => [data, ...prev])
      fermer()
    }
  }

  const statutInfo = (val) => STATUTS.find(s => s.value === val) || STATUTS[0]

  // ── Styles ──
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
    color: '#e8f5e8', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = { color: '#a8d5a2', fontSize: 15, marginBottom: 4, display: 'block' }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#e8f5e8', fontSize: 20, margin: 0 }}>
          Ton jardin
        </h2>
        <button onClick={ouvrir} style={{
          padding: '10px 18px', background: 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
          border: 'none', borderRadius: 12, color: '#fff', fontSize: 16,
          cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
        }}>
          + Ajouter une culture
        </button>
      </div>

      {/* ── Liste des cultures ── */}
      {cultures.length === 0 ? (
        <p style={{ color: '#6dbf6d', fontSize: 16 }}>
          Aucune culture pour l'instant. Ajoute ta premiere !
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cultures.map(c => {
            const st = statutInfo(c.statut)
            return (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(109,191,109,0.15)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#e8f5e8', fontSize: 18, fontWeight: 'bold' }}>
                    {c.legume}{c.variete ? ` – ${c.variete}` : ''}
                  </span>
                  <span style={{
                    background: st.color + '22', color: st.color,
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 'bold',
                  }}>
                    {st.label}
                  </span>
                </div>
                <div style={{ color: '#a8d5a2', fontSize: 12 }}>
                  {(!c.date_semis || c.date_semis === '1970-01-01') ? 'Semis : à planifier' : 'Semis : ' + new Date(c.date_semis).toLocaleDateString('fr-FR')}
                </div>
                {c.notes && (
                  <div style={{ color: '#7daa7d', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                    {c.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
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
            <h3 style={{ color: '#e8f5e8', fontSize: 18, margin: '0 0 20px' }}>
              Nouvelle culture
            </h3>

            {/* Legume */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}> *</label>
              <LegumeSearch
                value={form.legume_ref_id}
                onChange={v => {
                  const leg = legumesRef.find(l => l.id === v)
                  const nom = leg ? leg.nom : ''
                  const conseilData = CONSEILS_ECHELONNEMENT[nom]
                  setForm(prev => ({
                    ...prev,
                    legume_ref_id: v,
                    legume: nom,
                    intervalle_semis_semaines: conseilData?.intervalle || 2,
                  }))
                }}
                placeholder="Rechercher un légume..."
                options={legumesRef.map(l => ({ value: l.id, label: l.nom }))}
              />
            </div>

            {/* Variete */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Variete</label>
              <input
                type="text"
                placeholder="Ex : Coeur de boeuf"
                value={form.variete}
                onChange={e => handleChange('variete', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Statut */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Statut *</label>
              <CustomSelect
                value={form.statut}
                onChange={v => handleChange('statut', v)}
                options={STATUTS.map(s => ({ value: s.value, label: s.label }))}
              />
            </div>

            {/* Date de semis */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Date de semis</label>
              <input
                type="date"
                value={form.date_semis}
                onChange={e => handleChange('date_semis', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Nombre de semis */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Combien de semis successifs ?</label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.nb_semis}
                onChange={e => handleChange('nb_semis', Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                style={inputStyle}
              />
            </div>

            {/* Intervalle entre semis */}
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

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                placeholder="Notes libres..."
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={fermer} style={{
                flex: 1, padding: '12px', background: 'transparent',
                border: '1px solid rgba(109,191,109,0.3)', borderRadius: 12,
                color: '#a8d5a2', fontSize: 16, cursor: 'pointer', fontFamily: 'Amaranth, sans-serif',
              }}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={{
                flex: 1, padding: '12px',
                background: saving ? '#3a5a3a' : 'linear-gradient(135deg, #4a7c4a, #6dbf6d)',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: 16,
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'Amaranth, sans-serif',
              }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
