-- Ajout du champ date_recolte_debut sur la table cultures
-- Stocke la date réelle de début de récolte confirmée par l'utilisateur

ALTER TABLE cultures ADD COLUMN date_recolte_debut date;
