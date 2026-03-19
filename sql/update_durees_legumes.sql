-- Ajout des colonnes duree_avant_plantation_jours et duree_avant_recolte_jours
-- duree_avant_plantation_jours : jours entre semis et plantation
-- duree_avant_recolte_jours : jours entre plantation et debut de recolte

UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 60 WHERE slug = 'tomate';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 60 WHERE slug = 'courgette';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 60 WHERE slug = 'concombre';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 90 WHERE slug = 'courge';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 100 WHERE slug = 'potiron';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 100 WHERE slug = 'butternut';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 60 WHERE slug = 'haricot-vert';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 70 WHERE slug = 'haricot-a-rames';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 90 WHERE slug = 'feve';
UPDATE legumes_ref SET duree_avant_plantation_jours = 30, duree_avant_recolte_jours = 30 WHERE slug = 'basilic';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 30 WHERE slug = 'persil';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 60 WHERE slug = 'piment';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 60 WHERE slug = 'poivron';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 70 WHERE slug = 'aubergine';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 70 WHERE slug = 'carotte';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 25 WHERE slug = 'radis';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 60 WHERE slug = 'navet';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 90 WHERE slug = 'panais';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 90 WHERE slug = 'betterave';
UPDATE legumes_ref SET duree_avant_plantation_jours = 30, duree_avant_recolte_jours = 45 WHERE slug = 'laitue';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 30 WHERE slug = 'roquette';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 30 WHERE slug = 'mesclun';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 60 WHERE slug = 'mache';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 45 WHERE slug = 'epinard';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 120 WHERE slug = 'oignon';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 100 WHERE slug = 'echalote';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 180 WHERE slug = 'ail';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 90 WHERE slug = 'poireau';
UPDATE legumes_ref SET duree_avant_plantation_jours = 60, duree_avant_recolte_jours = 90 WHERE slug = 'celeri';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 70 WHERE slug = 'fenouil';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 70 WHERE slug = 'brocoli';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 80 WHERE slug = 'chou';
UPDATE legumes_ref SET duree_avant_plantation_jours = 45, duree_avant_recolte_jours = 60 WHERE slug = 'chou-kale';
UPDATE legumes_ref SET duree_avant_plantation_jours = 50, duree_avant_recolte_jours = 90 WHERE slug = 'chou-fleur';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 60 WHERE slug = 'fraise';
UPDATE legumes_ref SET duree_avant_plantation_jours = 30, duree_avant_recolte_jours = 80 WHERE slug = 'mais';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 65 WHERE slug = 'petit-pois';
UPDATE legumes_ref SET duree_avant_plantation_jours = NULL, duree_avant_recolte_jours = 60 WHERE slug = 'pois-gourmands';
