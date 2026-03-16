export function getZone(profile) {
  const villesNord = ['lille', 'paris', 'rouen', 'amiens', 'reims', 'metz', 'strasbourg', 'nancy', 'rennes', 'caen', 'brest', 'le havre', 'dijon', 'besançon', 'orléans', 'tours', 'le mans', 'angers', 'nantes'];
  const villesSud = ['marseille', 'nice', 'toulon', 'montpellier', 'perpignan', 'nîmes', 'avignon', 'aix-en-provence', 'ajaccio', 'bastia', 'béziers', 'carcassonne', 'pau', 'bayonne', 'biarritz'];
  const v = (profile?.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (profile?.latitude != null) {
    if (profile.latitude > 47) return 'nord';
    if (profile.latitude < 44) return 'sud';
    return 'centre';
  }

  if (villesSud.some(s => v.includes(s))) return 'sud';
  if (villesNord.some(s => v.includes(s))) return 'nord';
  return 'centre';
}

function isInFenetre(fenetre, mmdd) {
  if (!fenetre?.debut || !fenetre?.fin) return false;
  return mmdd >= fenetre.debut && mmdd <= fenetre.fin;
}

function getMMDD() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

export function getConseilsJour(profile, cultures, legumesRef) {
  const zone = getZone(profile);
  const mmdd = getMMDD();
  const result = {
    taches_urgentes: [],
    alertes: [],
    suggestions_semis: [],
    successions: [],
    recoltes_prochaines: [],
  };

  if (!legumesRef?.length) return result;

  const culturesActives = (cultures || []).filter(c => c.statut !== 'termine');
  const slugsActifs = new Set(
    culturesActives.map(c => {
      const ref = legumesRef.find(l => l.id === c.legume_ref_id);
      return ref?.slug || c.legume?.toLowerCase();
    })
  );

  // 1. Tâches par culture
  for (const culture of cultures || []) {
    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref?.taches_par_stade) continue;

    const taches = ref.taches_par_stade[culture.statut];
    if (taches?.length) {
      for (const tache of taches) {
        result.taches_urgentes.push({
          legume: culture.legume,
          variete: culture.variete,
          tache,
        });
      }
    }
  }

  // 2. Suggestions de semis
  for (const leg of legumesRef) {
    const calendrier = leg.calendrier?.[zone];
    if (!calendrier) continue;

    const enSemisAbri = isInFenetre(calendrier.semis_abri, mmdd);
    const enSemisTerre = isInFenetre(calendrier.semis_pleine_terre, mmdd);
    const enSemisGeneral = isInFenetre(calendrier.semis, mmdd);

    if (!enSemisAbri && !enSemisTerre && !enSemisGeneral) continue;

    const slug = leg.slug || leg.nom?.toLowerCase();
    if (slugsActifs.has(slug)) continue;

    const mode = enSemisAbri ? 'sous abri' : enSemisTerre ? 'pleine terre' : 'semis';
    result.suggestions_semis.push({
      legume: leg.nom,
      slug: leg.slug,
      mode,
    });
  }

  // 3. Récoltes prochaines
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (const culture of cultures || []) {
    if (culture.statut !== 'en_place') continue;
    if (!culture.date_semis) continue;

    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref?.duree_culture_jours) continue;

    const dateSemis = new Date(culture.date_semis);
    const dateRecolte = new Date(dateSemis);
    dateRecolte.setDate(dateRecolte.getDate() + ref.duree_culture_jours);

    const diff = Math.ceil((dateRecolte - now) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 14) {
      result.recoltes_prochaines.push({
        legume: culture.legume,
        variete: culture.variete,
        jours_restants: diff,
      });
    }
  }

  // 4. Successions
  for (const culture of cultures || []) {
    if (culture.statut !== 'termine' && culture.statut !== 'recolte') continue;

    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref?.successions?.length) continue;

    result.successions.push({
      apres: culture.legume,
      suggestions: ref.successions,
    });
  }

  return result;
}
