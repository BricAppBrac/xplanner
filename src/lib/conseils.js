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
  if (fenetre.debut <= fenetre.fin) {
    return mmdd >= fenetre.debut && mmdd <= fenetre.fin;
  }
  // Chevauchement d'année (ex: 11-01 → 02-28)
  return mmdd >= fenetre.debut || mmdd <= fenetre.fin;
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
    successions_possibles: [],
    associations: [],
    recoltes_prochaines: [],
  };

  const slugToNom = (slug) => {
    const ref = legumesRef.find(l => l.slug === slug);
    return ref?.nom || slug.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
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
    const slug = leg.slug || leg.nom?.toLowerCase();
    if (slugsActifs.has(slug)) continue;

    const abri = { debut: leg[`semis_abri_${zone}_debut`], fin: leg[`semis_abri_${zone}_fin`] };
    const terre = { debut: leg[`semis_terre_${zone}_debut`], fin: leg[`semis_terre_${zone}_fin`] };

    const enSemisAbri = isInFenetre(abri, mmdd);
    const enSemisTerre = isInFenetre(terre, mmdd);

    if (!enSemisAbri && !enSemisTerre) continue;

    const mode = enSemisAbri ? 'sous abri' : 'pleine terre';
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
    if (culture.statut !== 'plante' && culture.statut !== 'en_place') continue;
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

  // 4. Alertes saisonnières (pour les légumes cultivés activement)
  const mois = now.getMonth() + 1;
  const alertesSaison = [];
  if (mois >= 11 || mois <= 3) alertesSaison.push('gel');
  if (mois >= 6 && mois <= 8) alertesSaison.push('canicule', 'secheresse');
  if (mois >= 4 && mois <= 6) alertesSaison.push('pluie_prolongee');
  if (mois >= 9 && mois <= 10) alertesSaison.push('pluie_prolongee');

  const alertesSeen = new Set();
  for (const culture of culturesActives) {
    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    const alertes = ref?.alertes_saisonnieres;
    if (!alertes || typeof alertes !== 'object') continue;
    for (const type of alertesSaison) {
      if (alertes[type]) {
        const msg = `${culture.legume} : ${alertes[type]}`;
        if (alertesSeen.has(msg)) continue;
        alertesSeen.add(msg);
        result.alertes.push(msg);
      }
    }
  }

  // 5. Successions (ancien format, conservé pour compatibilité)
  for (const culture of cultures || []) {
    if (culture.statut !== 'termine' && culture.statut !== 'recolte') continue;

    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref?.successions?.length) continue;

    result.successions.push({
      apres: culture.legume,
      suggestions: ref.successions,
    });
  }

  // 6. Successions possibles (enrichies) — une seule entrée par legume_ref_id
  const successionsSeen = new Set();
  for (const culture of cultures || []) {
    if (culture.statut === 'termine') continue;
    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref?.successions?.length) continue;
    if (successionsSeen.has(culture.legume_ref_id)) continue;
    successionsSeen.add(culture.legume_ref_id);
    const suggestions = ref.successions.map(slugToNom);

    // Cas A : cultures en récolte
    if (culture.statut === 'recolte') {
      result.successions_possibles.push({
        apres: culture.legume,
        variete: culture.variete,
        statut: culture.statut,
        suggestions,
        imminente: false,
      });
      continue;
    }

    // Cas B : récolte imminente (< 30 jours)
    if ((culture.statut === 'plante' || culture.statut === 'en_place') && culture.date_semis && ref.duree_culture_jours) {
      const dateSemis = new Date(culture.date_semis);
      const dateRecolte = new Date(dateSemis);
      dateRecolte.setDate(dateRecolte.getDate() + ref.duree_culture_jours);
      const diff = Math.ceil((dateRecolte - now) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 30) {
        result.successions_possibles.push({
          apres: culture.legume,
          variete: culture.variete,
          statut: culture.statut,
          suggestions,
          imminente: true,
          jours_restants: diff,
        });
        continue;
      }
    }

    // Cas C : toute autre culture active — info à prévoir
    result.successions_possibles.push({
      apres: culture.legume,
      variete: culture.variete,
      statut: culture.statut,
      suggestions,
      imminente: false,
      info: true,
    });
  }

  // 7. Associations — une seule entrée par legume_ref_id
  const associationsSeen = new Set();
  for (const culture of cultures || []) {
    if (culture.statut === 'termine') continue;
    const ref = legumesRef.find(l => l.id === culture.legume_ref_id);
    if (!ref) continue;
    if (associationsSeen.has(culture.legume_ref_id)) continue;
    associationsSeen.add(culture.legume_ref_id);

    const benefiques = (ref.associations || []).map(slugToNom);
    const eviter = (ref.rotations_eviter || []).map(slugToNom);

    if (benefiques.length || eviter.length) {
      result.associations.push({
        legume: culture.legume,
        variete: culture.variete,
        benefiques,
        eviter,
      });
    }
  }

  return result;
}
