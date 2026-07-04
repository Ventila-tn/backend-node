-- Script simple pour corriger les frais de livraison
-- La table settings existe déjà

-- Insérer ou mettre à jour les frais de livraison à 7 TND
INSERT INTO settings (key, value) 
VALUES ('delivery_fee', '7')
ON CONFLICT (key) 
DO UPDATE SET value = '7';

-- Vérifier le résultat
SELECT key, value FROM settings WHERE key = 'delivery_fee';