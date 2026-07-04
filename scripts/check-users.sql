-- Script pour vérifier les utilisateurs dans Supabase

-- 1. Voir tous les utilisateurs
SELECT id, username, roles FROM users;

-- 2. Voir le type de la colonne roles
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'roles';

-- 3. Si vous avez des utilisateurs de Spring Boot avec roles en array,
-- créer un nouvel utilisateur Node.js compatible :
INSERT INTO users (username, password, roles)
VALUES (
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  '["ROLE_ADMIN"]'::jsonb
);

-- 4. Mettre à jour un utilisateur existant pour le rendre compatible Node.js
-- UPDATE users 
-- SET roles = '["ROLE_ADMIN"]'::jsonb 
-- WHERE username = 'votre_username';
