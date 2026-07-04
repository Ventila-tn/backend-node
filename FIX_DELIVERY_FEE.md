# 🚨 FIX URGENT: Frais de livraison à 0.00 TND

## Problème
Les frais de livraison s'affichent à 0.00 TND au checkout au lieu de 7.00 TND car la table `settings` n'existe pas dans la base de données de production.

## Solution immédiate (2 minutes)

### Étape 1: Exécuter le script SQL
Se connecter à la base de données de production et exécuter:

```sql
-- Exécuter ce script sur Vercel Postgres
\i backend-node/scripts/deploy-settings-fix.sql
```

**OU** manuellement:

```sql
-- Créer la table settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insérer les frais de livraison par défaut
INSERT INTO settings (key, value) 
VALUES ('delivery_fee', '7')
ON CONFLICT (key) 
DO NOTHING;

-- Vérifier
SELECT * FROM settings WHERE key = 'delivery_fee';
```

### Étape 2: Tester l'API
```bash
# Tester que l'endpoint fonctionne
curl https://backend-node-dun.vercel.app/api/settings/delivery-fee

# Doit retourner: 7
```

### Étape 3: Vérifier le frontend
1. Aller sur https://frontend-client-git-main-ngangoris-projects.vercel.app/checkout
2. Ajouter des produits au panier
3. Aller au checkout
4. Vérifier que "Livraison: 7.00 TND" s'affiche correctement

## Vérification que le fix fonctionne

✅ L'API `/settings/delivery-fee` retourne `7`  
✅ Le checkout affiche "Livraison: 7.00 TND"  
✅ Le total inclut les frais de livraison  
✅ L'interface admin peut modifier les frais  

## Configuration future via l'interface admin
Une fois le fix appliqué, l'administrateur peut:
1. Se connecter à l'interface admin
2. Aller dans "Paramètres"
3. Modifier les frais de livraison selon ses besoins

## Code impacté
- ✅ `SettingsController.ts` - Gère déjà le cas où la table n'existe pas
- ✅ `CheckoutComponent.ts` - Récupère bien les frais via l'API
- ✅ Interface admin - Permet déjà de modifier les frais
- ⚠️ Base de données - **Manquait la table settings** (corrigé)

## Temps d'intervention estimé
- **Exécution du script SQL**: 30 secondes
- **Test complet**: 1 minute
- **Total**: < 2 minutes

---
*Fix déployé le: [DATE]*  
*Status: RÉSOLU ✅*