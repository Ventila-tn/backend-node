-- Vérifier la structure complète de la table orders
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Vérifier les contraintes sur la table orders
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'orders';

-- Essayer d'insérer une commande test avec user_id = NULL
-- Décommentez pour tester:
-- INSERT INTO orders (
--     user_id, first_name, last_name, address, phone, email, 
--     city, governorate, delivery_fee, status, has_stock_shortage, 
--     order_date, total_amount
-- )
-- VALUES (
--     NULL, 'Test', 'User', '123 Rue Test', '0612345678', 'test@test.com',
--     'Paris', 'Ile-de-France', 7.00, 'PENDING_CONFIRMATION', false,
--     NOW(), 0.00
-- );
