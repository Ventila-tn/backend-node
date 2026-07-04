-- Script pour rendre user_id nullable dans la table orders
-- Ceci permet les commandes "guest checkout" sans utilisateur connecté

-- Vérifier la structure actuelle de la table orders
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Modifier la colonne user_id pour la rendre nullable
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Vérifier que la modification a été appliquée
SELECT 
    column_name, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Test: La requête suivante devrait maintenant fonctionner
-- INSERT INTO orders (user_id, first_name, last_name, address, phone, email, status, has_stock_shortage, order_date, total_amount)
-- VALUES (NULL, 'Test', 'User', '123 Test St', '1234567890', 'test@example.com', 'PENDING_CONFIRMATION', false, NOW(), 0);
