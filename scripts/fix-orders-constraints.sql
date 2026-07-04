-- Fix pour les contraintes de la table orders
-- Rendre les colonnes user_id et reference nullables

-- 1. Rendre user_id nullable (pour les commandes guest)
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Rendre reference nullable (sera NULL jusqu'à génération/affectation)
ALTER TABLE orders 
ALTER COLUMN reference DROP NOT NULL;

-- 3. Vérifier les modifications
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('user_id', 'reference')
ORDER BY column_name;

-- 4. Test: Cette requête devrait maintenant fonctionner
INSERT INTO orders (
    user_id, first_name, last_name, address, phone, email, 
    city, governorate, delivery_fee, status, has_stock_shortage, 
    order_date, total_amount, reference
)
VALUES (
    NULL, 'Test', 'User', '123 Rue Test', '0612345678', 'test@test.com',
    'Paris', 'Ile-de-France', 7.00, 'PENDING_CONFIRMATION', false,
    NOW(), 0.00, NULL
)
RETURNING id, reference, user_id;

-- 5. Nettoyer le test (décommentez si vous avez fait le test ci-dessus)
-- DELETE FROM orders WHERE first_name = 'Test' AND last_name = 'User';
