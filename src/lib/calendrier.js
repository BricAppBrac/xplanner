import { getZone } from './conseils'

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
    const nbSemis = culture.nb_semis || 1;
    const intervalle = culture.intervalle_semis_semaines || 3;
    const statutCulture = culture.statut;
    const itineraire = culture.itineraire;
    const dateSemisRef = getDateSemisRef(culture);

    const semisFait = SEMIS_FAITS.includes(statutCulture);
    const godetFait = GODET_FAIT.includes(statutCulture);
    const plantationFaite = PLANTATION_FAITE.includes(statutCulture);
    const recolteFaite = RECOLTE_FAITE.includes(statutCulture);

    // Cultures en attente : événement "À faire"
    if (statutCulture === 'a_semer' || statutCulture === 'a_planter') {
      const dateAjout = culture.created_at ? new Date(culture.created_at) : now;
      let labelAfaire;
      if (itineraire === 'D') labelAfaire = '🛒 Plantation prévue';
      else if (itineraire === 'C') labelAfaire = '🌍 Semis en place prévu';
      else labelAfaire = '🌱 Semis sous abri prévu';
      evenements.push({
        date: dateAjout,
        legume: nom, variete, slug: ref.slug,
        cultureId: culture.id, itineraire,
        type: 'a_faire', label: labelAfaire,
        statut: 'a_faire',
      });
    }

    // ── SEMIS ──
    if (itineraire === 'A') {
      // Itinéraire A : deux événements — plateau + repiquage godets
      const abriDebut = ref[`semis_abri_${zone}_debut`];
      const abriFin = ref[`semis_abri_${zone}_fin`];

      for (let i = 0; i < nbSemis; i++) {
        const suffix = nbSemis > 1 ? ` ${i + 1}/${nbSemis}` : '';
        const decalage = i * intervalle * 7;

        // Événement 1 : Semis en plateau
        let datePlateau;
        if (semisFait && dateSemisRef && i === 0) {
          datePlateau = new Date(dateSemisRef);
        } else if (abriDebut) {
          datePlateau = mmddToDate(abriDebut, year);
          if (datePlateau) datePlateau.setDate(datePlateau.getDate() + decalage);
        }
        if (datePlateau) {
          const debutDate = abriDebut ? mmddToDate(abriDebut, year) : null;
          const finDate = abriFin ? mmddToDate(abriFin, year) : null;
          evenements.push({
            date: datePlateau,
            legume: nom, variete, slug: ref.slug,
            cultureId: culture.id, itineraire,
            type: 'semis', label: `🌱 Semis en plateau sous abri${suffix}`,
            statut: badgeEvt(datePlateau, now, semisFait),
          });
        }

        // Événement 2 : Repiquage en godets (+21 jours)
        const baseGodet = (semisFait && dateSemisRef && i === 0) ? new Date(dateSemisRef) : (abriDebut ? mmddToDate(abriDebut, year) : null);
        if (baseGodet) {
          const dateGodet = new Date(baseGodet);
          dateGodet.setDate(dateGodet.getDate() + 21 + decalage);
          evenements.push({
            date: dateGodet,
            legume: nom, variete, slug: ref.slug,
            cultureId: culture.id, itineraire,
            type: 'semis', label: `🪴 Repiquage en godets${suffix}`,
            statut: badgeEvt(dateGodet, now, godetFait),
          });
        }
      }
    } else if (itineraire !== 'D') {
      // Itinéraires B et C — semis classique
      const sources = [
        { prefixe: 'semis_abri', label: itineraire === 'B' ? '🌱 Semis en godet sous abri' : '🌱 Semis sous abri' },
        { prefixe: 'semis_terre', label: '🌱 Semis en pleine terre' },
      ];

      for (const { prefixe, label } of sources) {
        const debut = ref[`${prefixe}_${zone}_debut`];
        const fin = ref[`${prefixe}_${zone}_fin`];
        if (!debut || !fin) continue;

        const debutDate = mmddToDate(debut, year);
        const finDate = mmddToDate(fin, year);
        if (!debutDate) continue;
        if (finDate && finDate < debutDate) finDate.setFullYear(finDate.getFullYear() + 1);

        for (let i = 0; i < nbSemis; i++) {
          const semisLabel = nbSemis > 1 ? `${label} ${i + 1}/${nbSemis}` : label;

          if (semisFait && dateSemisRef && i === 0) {
            evenements.push({
              date: new Date(dateSemisRef),
              legume: nom, variete, slug: ref.slug,
              cultureId: culture.id, itineraire,
              type: 'semis', label: semisLabel,
              statut: 'fait',
            });
          } else {
            const date = new Date(debutDate);
            date.setDate(date.getDate() + i * intervalle * 7);
            evenements.push({
              date,
              legume: nom, variete, slug: ref.slug,
              cultureId: culture.id, itineraire,
              type: 'semis', label: semisLabel,
              statut: badgeEvt(date, now, semisFait),
            });
          }
        }
      }
    }
    // Itinéraire D : pas de semis

    // ── PLANTATION & RÉCOLTE ──
    const plantDebut = ref[`plantation_${zone}_debut`];
    const plantFin = ref[`plantation_${zone}_fin`];
    const recDebut = ref[`recolte_${zone}_debut`];
    const recFin = ref[`recolte_${zone}_fin`];
    const decalageJours = intervalle * 7;

    for (let i = 0; i < nbSemis; i++) {
      const decalage = i * decalageJours;
      const suffix = nbSemis > 1 ? ` ${i + 1}/${nbSemis}` : '';

      if (plantDebut) {
        if (plantationFaite && culture.date_plantation && i === 0) {
          evenements.push({
            date: new Date(culture.date_plantation),
            legume: nom, variete, slug: ref.slug,
            cultureId: culture.id, itineraire,
            type: 'plantation', label: `🪴 Plantation${suffix}`,
            statut: 'fait',
          });
        } else {
          const plantDate = mmddToDate(plantDebut, year);
          const plantFinDate = plantFin ? mmddToDate(plantFin, year) : null;
          if (plantDate) {
            const date = new Date(plantDate);
            date.setDate(date.getDate() + decalage);
            evenements.push({
              date,
              legume: nom, variete, slug: ref.slug,
              cultureId: culture.id, itineraire,
              type: 'plantation', label: `🪴 Plantation${suffix}`,
              statut: badgeEvt(date, now, plantationFaite),
            });
          }
        }
      }

      if (recDebut) {
        const recDate = mmddToDate(recDebut, year);
        const recFinDate = recFin ? mmddToDate(recFin, year) : null;
        if (recDate) {
          const date = new Date(recDate);
          date.setDate(date.getDate() + decalage);
          let evtStatut;
          if (statutCulture === 'recolte') evtStatut = 'en_cours';
          else if (recolteFaite) evtStatut = 'fait';
          else evtStatut = badgeEvt(date, now, false);
          evenements.push({
            date,
            legume: nom, variete, slug: ref.slug,
            cultureId: culture.id, itineraire,
            type: 'recolte', label: `🧺 Début de récolte${suffix}`,
            statut: evtStatut,
          });
        }
      }
    }
  }

  evenements.sort((a, b) => a.date - b.date);

  const parMois = {};
  for (const evt of evenements) {
    const key = `${evt.date.getFullYear()}-${String(evt.date.getMonth() + 1).padStart(2, '0')}`;
    if (!parMois[key]) parMois[key] = [];
    parMois[key].push(evt);
  }

  return parMois;
}
