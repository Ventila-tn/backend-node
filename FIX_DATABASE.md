# Fix Database - user_id Nullable

## Problème
La colonne `user_id` dans la table `orders` a une contrainte NOT NULL, mais elle devrait être nullable pour permettre les commandes "guest checkout" (sans utilisateur connecté).

## Solution

### Étape 1: Accéder à Supabase
1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)

### Étape 2: Exécuter le script SQL
Copiez et exécutez cette commande SQL:

```sql
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;
```

### Étape 3: Vérifier
Vérifiez que la modification a bien été appliquée:

```sql
SELECT 
    column_name, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';
```

Le résultat devrait montrer `is_nullable = YES`

### Alternative: Script complet
Vous pouvez aussi utiliser le script complet dans `scripts/fix-orders-user-id.sql`

## Après la modification

Une fois la base de données modifiée:
1. Le checkout fonctionnera immédiatement
2. Les commandes avec `user_id = NULL` seront des commandes "guest"
3. Les commandes avec un `user_id` seront des commandes d'utilisateurs connectés

## Contexte technique

Dans Spring Boot, la relation est définie comme:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private User user;
```

Sans `nullable = false`, JPA crée une colonne nullable. Mais si votre base de données a été créée avec une contrainte NOT NULL, il faut la supprimer manuellement.
