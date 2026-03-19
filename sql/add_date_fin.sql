-- Ajout du champ date_fin sur la table cultures
-- Stocke la date de fin de culture confirmée par l'utilisateur

ALTER TABLE cultures ADD COLUMN date_fin date;
