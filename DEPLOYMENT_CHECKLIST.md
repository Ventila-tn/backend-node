# Checklist de Déploiement Complet

## ✅ Changements Backend Complétés

### 1. Ordre - Génération de référence automatique
- **Fichier**: `src/services/OrderService.ts`
- **Format**: `CMD-YYYYMMDD-XXXX` (ex: `CMD-20260704-1234`)
- **Impact**: Chaque commande a maintenant une référence unique

### 2. Ordre - Support commandes guest
- **Fichier**: `src/services/OrderService.ts`
- **Changement**: `user_id` explicitement NULL pour guest checkout
- **Impact**: Les commandes sans utilisateur connecté fonctionnent

### 3. Ordre - Mapping des champs
- **Fichier**: `src/controllers/OrderController.ts`
- **Changement**: Conversion snake_case → camelCase (firstName, lastName, etc.)
- **Impact**: Le frontend affiche correctement les noms des clients

### 4. Produits - Types numériques
- **Fichier**: `src/controllers/ProductController.ts`
- **Changement**: Conversion explicite en nombres (sellingPriceTTC, etc.)
- **Impact**: Les prix fonctionnent avec `.toFixed()` dans le frontend

### 5. Produits - Images
- **Fichiers**: `src/controllers/ProductController.ts`, `src/services/ProductService.ts`
- **Changement**: Récupération depuis table `product_images`
- **Impact**: Les images de produits s'affichent

### 6. Settings - Delivery Fee
- **Fichier**: `src/controllers/SettingsController.ts`
- **Changement**: Gestion robuste du body (nombre, string, objet) avec logging
- **Impact**: La mise à jour des frais de livraison fonctionne

## 📋 Actions Requises

### Étape 1: Modifier la Base de Données (OBLIGATOIRE)

Exécuter dans **Supabase SQL Editor**:

```sql
-- Rendre user_id nullable pour les commandes guest
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Rendre reference nullable (même si toujours généré)
ALTER TABLE orders ALTER COLUMN reference DROP NOT NULL;
```

**Pourquoi**: La base de données a ces colonnes en NOT NULL mais Spring Boot/Node.js ont besoin qu'elles soient nullables.

### Étape 2: Déployer le Backend

```bash
cd backend-node
git add .
git commit -m "Complete backend: orders, products, settings, images"
git push
```

**Vérification**: Attendre 1-2 minutes puis tester:
- https://backend-node-dun.vercel.app/health
- https://backend-node-dun.vercel.app/api/settings/delivery-fee

### Étape 3: Frontend Client - Delivery Fee Dynamique (OPTIONNEL)

**Fichiers déjà modifiés**:
- ✅ `frontend-client/src/app/core/services/setting.service.ts` (créé)
- ✅ `frontend-client/src/app/core/models/ecommerce.models.ts` (deliveryFee ajouté)

**Fichier à modifier manuellement**:
- ⚠️ `frontend-client/src/app/features/checkout/checkout.component.ts`

**Instructions**: Voir `frontend-client/FIX_CHECKOUT_DELIVERY_FEE.md`

## 🧪 Tests après Déploiement

### Backend API
1. **GET /api/settings/delivery-fee** → Retourne un nombre (ex: 7)
2. **PUT /api/settings/delivery-fee** (body: `8`) → Retourne 8
3. **POST /api/orders/checkout** → Crée commande avec référence
4. **GET /api/orders** → Retourne ordersavec firstName, lastName
5. **GET /api/products** → Retourne produits avec imageUrls et prix numériques

### Frontend Admin
1. **Paramètres** → Modifier frais de livraison → Succès
2. **Commandes** → Affiche noms clients et références

### Frontend Client
1. **Catalogue** → Images s'affichent
2. **Checkout** → Commande fonctionne, référence générée
3. **Confirmation** → Affiche référence (ex: CMD-20260704-1234)

## 🐛 Debugging

Si le **PUT /api/settings/delivery-fee** échoue encore:

1. Vérifier les logs Vercel (Functions tab)
2. Les logs afficheront:
   - `Received body:` - Valeur reçue
   - `Type:` - Type de la valeur
   - `Content-Type:` - Header
   - `Parsed fee:` - Valeur parsée

3. Tester avec curl:
```bash
curl -X PUT https://backend-node-dun.vercel.app/api/settings/delivery-fee \
  -H "Content-Type: application/json" \
  -d "8"
```

## 📊 Résumé des Endpoints

| Endpoint | Méthode | Status |
|----------|---------|--------|
| `/api/settings/delivery-fee` | GET | ✅ |
| `/api/settings/delivery-fee` | PUT | ✅ |
| `/api/orders/checkout` | POST | ✅ |
| `/api/orders` | GET | ✅ |
| `/api/products` | GET | ✅ |
| `/api/products/:id` | GET | ✅ |
| `/api/dashboard/stats` | GET | ✅ |

## ⚠️ Notes Importantes

1. **Ne PAS** redémarrer Vercel - le push déclenche automatiquement le déploiement
2. **Attendre 1-2 minutes** après le push pour que Vercel déploie
3. **Vider le cache** du navigateur si les changements ne sont pas visibles
4. **Les logs** sont accessibles dans Vercel → Functions → View Logs
