-- Fix final pour la table orders
-- Rendre user_id et reference nullables

-- 1. Rendre user_id nullable (pour les commandes guest)
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Rendre reference nullable (au cas où, même si on génère toujours une valeur)
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

-- 4. Afficher quelques commandes existantes pour vérifier
SELECT id, reference, first_name, last_name, order_date, status
FROM orders 
ORDER BY order_date DESC 
LIMIT 5;
