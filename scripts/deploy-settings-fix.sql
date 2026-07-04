-- Script de déploiement pour corriger les frais de livraison
-- À exécuter en production immédiatement

BEGIN;

-- 1. Créer la table settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insérer les frais de livraison par défaut (7 TND)
INSERT INTO settings (key, value) 
VALUES ('delivery_fee', '7')
ON CONFLICT (key) 
DO NOTHING; -- Ne pas écraser si existe déjà

-- 3. Créer une fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Créer le trigger pour auto-update de updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Vérifier le résultat
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM settings WHERE key = 'delivery_fee') THEN
        RAISE NOTICE 'SUCCESS: Frais de livraison configurés correctement';
    ELSE
        RAISE EXCEPTION 'ERREUR: Impossible de configurer les frais de livraison';
    END IF;
END $$;

COMMIT;

-- 6. Afficher la configuration actuelle
SELECT 
    key as "Paramètre",
    value as "Valeur", 
    created_at as "Créé le",
    updated_at as "Modifié le"
FROM settings 
WHERE key = 'delivery_fee';