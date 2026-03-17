import { getZone } from './conseils'

function mmddToDate(mmdd, year) {
  if (!mmdd) return null;
  const [mm, dd] = mmdd.split('-').map(Number);
  return new Date(year, mm - 1, dd);
}

function statutDate(date, now, debutDate, finDate) {
  const jour = 24 * 60 * 60 * 1000;
  const diff = date.getTime() - now.getTime();

  if (debutDate && finDate && now >= debutDate && now <= finDate) return 'en_cours';
  if (date < now) return 'passe';
  if (diff >= 0 && diff <= 7 * jour) return 'cette_semaine';
  return 'a_venir';
}

function ajouterSemis(evenements, ref, zone, nom, variete, year, now, nbSemis, intervalle) {
  const sources = [
    { prefixe: 'semis_abri', label: '🌱 Semis sous abri' },
    { prefixe: 'semis_terre', label: '🌱 Semis pleine terre' },
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
      const date = new Date(debutDate);
      date.setDate(date.getDate() + i * intervalle * 7);

      const semisLabel = nbSemis > 1
        ? `${label} ${i + 1}/${nbSemis}`
        : label;

      evenements.push({
        date,
        legume: nom, variete, slug: ref.slug,
        type: 'semis',
        label: semisLabel,
        statut: statutDate(date, now, debutDate, finDate),
      });
    }
  }
}

export function calculerCalendrier(profile, cultures, legumesRef) {
  const zone = getZone(profile);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  const evenements = [];

  for (const culture of cultures || []) {
    if (culture.statut === 'termine') continue;

    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref) continue;

    const nom = culture.legume || ref.nom;
    const variete = culture.variete || '';
    const nbSemis = culture.nb_semis || 1;
    const intervalle = culture.intervalle_semis_semaines || 3;

    // Semis (avec semis successifs si nb_semis > 1)
    ajouterSemis(evenements, ref, zone, nom, variete, year, now, nbSemis, intervalle);

    // Plantation
    const plantDebut = ref[`plantation_${zone}_debut`];
    const plantFin = ref[`plantation_${zone}_fin`];
    if (plantDebut) {
      const plantDate = mmddToDate(plantDebut, year);
      const plantFinDate = plantFin ? mmddToDate(plantFin, year) : null;
      if (plantDate) {
        evenements.push({
          date: plantDate,
          legume: nom, variete, slug: ref.slug,
          type: 'plantation',
          label: '🪴 Plantation',
          statut: statutDate(plantDate, now, plantDate, plantFinDate),
        });
      }
    }

    // Récolte
    const recDebut = ref[`recolte_${zone}_debut`];
    const recFin = ref[`recolte_${zone}_fin`];
    if (recDebut) {
      const recDate = mmddToDate(recDebut, year);
      const recFinDate = recFin ? mmddToDate(recFin, year) : null;
      if (recDate) {
        evenements.push({
          date: recDate,
          legume: nom, variete, slug: ref.slug,
          type: 'recolte',
          label: '🧺 Début de récolte',
          statut: statutDate(recDate, now, recDate, recFinDate),
        });
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
