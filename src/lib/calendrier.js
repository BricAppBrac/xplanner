import { getZone } from './conseils'
import { supabase } from './supabase'

const INCIDENT_COLORS = {
  gel: '#c0392b',
  grele: '#c0392b',
  ravageurs: '#e67e22',
  maladie: '#e67e22',
  secheresse: '#f39c12',
  inondation: '#2980b9',
  autre: '#7f8c8d',
  recolte_terminee: '#873f5f',
}

const INCIDENT_EMOJIS = {
  gel: '🧊',
  grele: '🌩️',
  ravageurs: '🐛',
  maladie: '🍄',
  secheresse: '🌵',
  inondation: '🌊',
  autre: '❓',
  recolte_terminee: '🧺',
}

const INCIDENT_LABELS = {
  gel: 'Gel',
  grele: 'Grêle',
  ravageurs: 'Ravageurs',
  maladie: 'Maladie',
  secheresse: 'Sécheresse',
  inondation: 'Inondation',
  autre: 'Autre',
  recolte_terminee: 'Récolte terminée',
}

export async function chargerIncidents(userId) {
  const { data } = await supabase
    .from('incidents')
    .select('*, cultures(legume, variete)')
    .eq('user_id', userId)
    .order('date_incident', { ascending: true })
  return data || []
}

export { INCIDENT_COLORS, INCIDENT_EMOJIS, INCIDENT_LABELS }

function mmddToDate(mmdd, year) {
  if (!mmdd) return null;
  const [mm, dd] = mmdd.split('-').map(Number);
  return new Date(year, mm - 1, dd);
}

// Badge pour un événement : fait, a_faire, cette_semaine, ou rien (a_venir)
function badgeEvt(date, now, estFait) {
  if (estFait) return 'fait';
  const jour = 24 * 60 * 60 * 1000;
  const diff = date.getTime() - now.getTime();
  if (date < now) return 'a_faire'; // passé mais pas encore accompli
  if (diff >= 0 && diff <= 7 * jour) return 'cette_semaine';
  return 'a_venir';
}

const SEMIS_FAITS = ['seme_abri_plateau', 'seme_abri_godet', 'seme_place', 'plante', 'recolte', 'termine'];
const GODET_FAIT = ['seme_abri_godet', 'plante', 'recolte', 'termine'];
const PLANTATION_FAITE = ['plante', 'recolte', 'termine'];
const RECOLTE_FAITE = ['recolte', 'termine'];

const PROGRESSIONS = {
  'A': ['a_semer', 'seme_abri_plateau', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'B': ['a_semer', 'seme_abri_godet', 'plante', 'recolte', 'termine'],
  'C': ['a_semer', 'seme_place', 'recolte', 'termine'],
  'D': ['a_planter', 'plante', 'recolte', 'termine'],
};

// Trouver la date de référence pour le semis
function getDateSemisRef(culture) {
  if (culture.date_semis && culture.date_semis !== '1970-01-01') {
    const ds = new Date(culture.date_semis);
    const ca = culture.created_at ? new Date(culture.created_at) : null;
    // Si date_semis est bien postérieure à epoch, l'utiliser
    if (ds.getFullYear() > 2000) return ds;
    // Sinon fallback sur created_at
    if (ca) return ca;
  }
  if (culture.created_at) return new Date(culture.created_at);
  return null;
}

function makeEvtId(cultureId, type, label, dateStr) {
  return `${cultureId}_${type}_${label}_${dateStr}`;
}

function getProjectedSemisDate(culture, allCultures, ref, zone, year) {
  const ds = culture.date_semis ? new Date(culture.date_semis) : null;
  if (ds && ds.getFullYear() > 2000) return ds;

  if (culture.groupe_id && (culture.numero_semis || 1) > 1) {
    const leader = allCultures.find(c =>
      c.groupe_id === culture.groupe_id && (c.numero_semis || 1) === 1
    );
    if (leader) {
      const leaderDate = getProjectedSemisDate(leader, allCultures, ref, zone, year);
      if (leaderDate) {
        const intervalle = ref?.intervalle_echelonnement_jours || 21;
        const proj = new Date(leaderDate);
        proj.setDate(proj.getDate() + (culture.numero_semis - 1) * intervalle);
        return proj;
      }
    }
  }

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const abriDebut = ref?.[`semis_abri_${zone}_debut`];
  if (abriDebut) {
    const refDate = mmddToDate(abriDebut, year);
    return refDate > now ? refDate : now;
  }
  return now;
}

export function calculerCalendrier(profile, cultures, legumesRef) {
  const zone = getZone(profile);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  const evenements = [];

  for (const culture of cultures || []) {
    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref) continue;

    const nom = culture.legume || ref.nom;
    const variete = culture.variete || '';
    const statutCulture = culture.statut;
    const itineraire = culture.itineraire;
    const dateSemisRef = getDateSemisRef(culture);
    const totalSemis = culture.total_semis || 1;
    const numSemis = culture.numero_semis || 1;
    const semisTag = totalSemis > 1 ? ` ${numSemis}/${totalSemis}` : '';

    const semisFait = SEMIS_FAITS.includes(statutCulture);
    const godetFait = GODET_FAIT.includes(statutCulture);
    const plantationFaite = PLANTATION_FAITE.includes(statutCulture);
    const recolteFaite = RECOLTE_FAITE.includes(statutCulture);

    // ── SEMIS (1 culture = 1 événement semis) ──
    if (itineraire === 'A') {
      const baseA = getProjectedSemisDate(culture, cultures, ref, zone, year);

      if (baseA) {
        // Semis en plateau
        evenements.push({
          date: new Date(baseA),
          legume: nom, variete, slug: ref.slug,
          cultureId: culture.id, itineraire,
          type: 'semis', label: `🌱 Semis en plateau sous abri${semisTag}`,
          statut: badgeEvt(new Date(baseA), now, semisFait),
        });
        // Repiquage en godets (+21 jours)
        const dateGodet = new Date(baseA);
        dateGodet.setDate(dateGodet.getDate() + 21);
        evenements.push({
          date: dateGodet,
          legume: nom, variete, slug: ref.slug,
          cultureId: culture.id, itineraire,
          type: 'semis', label: `🪴 Repiquage en godets${semisTag}`,
          statut: badgeEvt(dateGodet, now, godetFait),
        });
      }
    } else if (itineraire !== 'D') {
      // Itinéraires B et C — un seul semis par culture
      const sources = [
        { prefixe: 'semis_abri', label: itineraire === 'B' ? `🌱 Semis en godet sous abri${semisTag}` : `🌱 Semis sous abri${semisTag}` },
        { prefixe: 'semis_terre', label: `🌱 Semis en pleine terre${semisTag}` },
      ];

      for (const { prefixe, label } of sources) {
        const debut = ref[`${prefixe}_${zone}_debut`];
        const fin = ref[`${prefixe}_${zone}_fin`];
        if (!debut || !fin) continue;

        const debutDate = mmddToDate(debut, year);
        if (!debutDate) continue;

        const base = getProjectedSemisDate(culture, cultures, ref, zone, year);
        evenements.push({
          date: base,
          legume: nom, variete, slug: ref.slug,
          cultureId: culture.id, itineraire,
          type: 'semis', label,
          statut: semisFait ? 'fait' : badgeEvt(base, now, false),
        });
      }
    }
    // Itinéraire D : pas de semis

    // ── PLANTATION & RÉCOLTE (1 par culture) ──
    const plantDebut = ref[`plantation_${zone}_debut`];
    const recDebut = ref[`recolte_${zone}_debut`];

    const basePlant = (plantationFaite && culture.date_plantation) ? new Date(culture.date_plantation) : (plantDebut ? mmddToDate(plantDebut, year) : null);
    const baseRec = recDebut ? mmddToDate(recDebut, year) : null;

    if (basePlant) {
      evenements.push({
        date: new Date(basePlant),
        legume: nom, variete, slug: ref.slug,
        cultureId: culture.id, itineraire,
        type: 'plantation', label: `🪴 Plantation${semisTag}`,
        statut: plantationFaite ? 'fait' : badgeEvt(new Date(basePlant), now, false),
      });
    }

    if (baseRec) {
      let evtStatut;
      if (statutCulture === 'recolte') evtStatut = 'en_cours';
      else if (recolteFaite) evtStatut = 'fait';
      else evtStatut = badgeEvt(new Date(baseRec), now, false);
      evenements.push({
        date: new Date(baseRec),
        legume: nom, variete, slug: ref.slug,
        cultureId: culture.id, itineraire,
        type: 'recolte', label: `🧺 Début de récolte${semisTag}`,
        statut: evtStatut,
      });
    }
  }

  // Générer un evtId unique pour chaque événement
  for (const evt of evenements) {
    const dateStr = evt.date.toISOString().split('T')[0];
    evt.evtId = makeEvtId(evt.cultureId, evt.type, evt.label, dateStr);
  }

  // Collecter tous les événements masqués
  const masques = new Set();
  for (const culture of cultures || []) {
    if (culture.evenements_masques) {
      for (const m of culture.evenements_masques) masques.add(m);
    }
  }

  // Filtrer les événements masqués
  const filtres = masques.size > 0
    ? evenements.filter(evt => !masques.has(evt.evtId))
    : evenements;

  filtres.sort((a, b) => a.date - b.date);

  const parMois = {};
  for (const evt of filtres) {
    const key = `${evt.date.getFullYear()}-${String(evt.date.getMonth() + 1).padStart(2, '0')}`;
    if (!parMois[key]) parMois[key] = [];
    parMois[key].push(evt);
  }

  return parMois;
}
