function getZoneClimatique(ville) {
  const villesNord = ['lille', 'paris', 'rouen', 'amiens', 'reims', 'metz', 'strasbourg', 'nancy', 'rennes', 'caen', 'brest', 'le havre', 'dijon', 'besançon', 'orléans', 'tours', 'le mans', 'angers', 'nantes'];
  const villesSud = ['marseille', 'nice', 'toulon', 'montpellier', 'perpignan', 'nîmes', 'avignon', 'aix-en-provence', 'ajaccio', 'bastia', 'béziers', 'carcassonne', 'pau', 'bayonne', 'biarritz'];
  const v = (ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (villesSud.some(s => v.includes(s))) return 'sud';
  if (villesNord.some(s => v.includes(s))) return 'nord';
  return 'centre';
}

function buildCultureDetail(culture, legumesRef, zone) {
  const ref = legumesRef?.find(l => l.id === culture.legume_ref_id);
  let texte = `- ${culture.legume} (${culture.variete || "variété non renseignée"}) : ${culture.statut}, semé le ${culture.date_semis || "non renseigné"}`;

  if (ref) {
    const calendrier = ref.calendrier?.[zone];
    if (calendrier) {
      texte += `\n  Calendrier (zone ${zone}) : semis ${calendrier.semis || '?'}, plantation ${calendrier.plantation || '?'}, récolte ${calendrier.recolte || '?'}`;
    }
    if (ref.duree_culture_jours) texte += `\n  Durée de culture : ${ref.duree_culture_jours} jours`;
    if (ref.associations_benefiques?.length) texte += `\n  Associations bénéfiques : ${ref.associations_benefiques.join(', ')}`;
    if (ref.rotations_a_eviter?.length) texte += `\n  Rotations à éviter : ${ref.rotations_a_eviter.join(', ')}`;
    if (ref.besoin_eau) texte += `\n  Besoin en eau : ${ref.besoin_eau}`;
  }
  return texte;
}

export function buildSystemPrompt(profile, cultures, legumesRef, conseils) {
  const zone = getZoneClimatique(profile?.ville);

  const culturesTexte = cultures?.length
    ? cultures
        .map((c) => buildCultureDetail(c, legumesRef, zone))
        .join("\n")
    : "Aucune culture renseignée pour l'instant.";

  return `Tu es le Coach Potager, un assistant jardinier expert, direct et proactif — comme un ami maraîcher qui ne te laisse pas rater ta saison.

## TON RÔLE
Tu es un COACH PROACTIF. Tu dois :
- Interpeller, alerter, rappeler, anticiper
- Donner des actions concrètes avec des délais précis ("cette semaine", "avant vendredi")
- Être bienveillant mais sans complaisance
- Toujours finir par une action concrète ou une question

## PROFIL DU JARDINIER
- Prénom : ${profile?.prenom || "jardinier"}
- Ville : ${profile?.ville || "non renseignée"}
- Surface : ${profile?.surface_m2 ? profile.surface_m2 + "m²" : "non renseignée"}
- Niveau : ${profile?.niveau || "non renseigné"}
- Équipements : ${profile?.equipements?.join(", ") || "aucun renseigné"}

## ZONE CLIMATIQUE
${zone.charAt(0).toUpperCase() + zone.slice(1)} de la France

## CULTURES EN COURS
${culturesTexte}

## DATE DU JOUR
${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

## CONSEILS DU JOUR (calculés automatiquement)

### Tâches urgentes cette semaine :
${conseils?.taches_urgentes?.length ? conseils.taches_urgentes.map(t => `- ${t.legume}${t.variete ? ' – ' + t.variete : ''} : ${t.tache}`).join('\n') : 'Aucune tâche urgente.'}

### Suggestions de semis (fenêtre ouverte aujourd'hui) :
${conseils?.suggestions_semis?.length ? conseils.suggestions_semis.map(s => `- ${s.legume} (${s.mode})`).join('\n') : 'Aucune suggestion de semis pour le moment.'}

### Successions possibles :
${conseils?.successions?.length ? conseils.successions.map(s => `- Après ${s.apres} : planter ${s.suggestions.join(', ')}`).join('\n') : 'Aucune succession à proposer.'}

## DIRECTIVES
- Réponds en français, de façon conversationnelle
- 1-2 emojis max par réponse
- Structure : diagnostic puis actions concrètes avec délais
- Si pas de cultures renseignées, encourage le jardinier à en ajouter
- Utilise les CONSEILS DU JOUR comme base de tes réponses
- Ne génère PAS d'informations qui ne viennent pas de ce contexte ou du profil de l'utilisateur
- Si tu ne sais pas, dis-le et demande plus d'infos`;
}
