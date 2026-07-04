-- Script pour initialiser la table settings et les frais de livraison
-- À exécuter sur la base de données de production

-- Créer la table settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insérer les frais de livraison par défaut (7 TND)
INSERT INTO settings (key, value) 
VALUES ('delivery_fee', '7')
ON CONFLICT (key) 
DO UPDATE SET value = '7';

-- Vérifier que l'insertion a fonctionné
SELECT * FROM settings WHERE key = 'delivery_fee';