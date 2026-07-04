# 🚨 Fix Error 413 - Content Too Large

## Problème
Erreur 413 lors de la mise à jour des produits avec images, causée par :
1. **Images base64 trop lourdes** (probable cause principale)
2. **Limites Express** par défaut (1MB)
3. **Limites Vercel** pour les payloads HTTP

## Solutions appliquées

### ✅ Solution 1: Augmentation limites Express
```typescript
// backend-node/src/index.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### ✅ Solution 2: Configuration Vercel optimisée
```json
// backend-node/vercel.json
{
  "functions": {
    "src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

## Solutions recommandées supplémentaires

### 🎯 Solution 3: Compression/Optimisation frontend
Dans l'interface admin, **avant upload** :
1. **Redimensionner** les images (max 800x600px)
2. **Compresser** la qualité JPEG (70-80%)
3. **Limiter** le nombre d'images simultanées
4. **Vérifier la taille** avant envoi

### 🎯 Solution 4: Upload en plusieurs étapes
Au lieu d'envoyer tout en une requête :
1. Créer/modifier le produit (sans images)
2. Uploader les images séparément
3. Lier les images au produit

### 🎯 Solution 5: Stockage externe (recommandé)
- **Cloudinary** ou **AWS S3** pour les images
- Envoyer seulement les URLs au backend
- Réduction drastique de la taille des requêtes

## Limites actuelles après fix

### Express (Backend)
- ✅ **Avant:** 1MB par défaut
- ✅ **Après:** 10MB configuré

### Vercel (Plateforme)
- ⚠️ **Limite absolue:** ~5-6MB par requête HTTP
- ⚠️ **Timeout:** 30 secondes max (configuré)

### Images recommandées
- **Format:** JPEG/WebP
- **Taille max:** 800x600px
- **Qualité:** 70-80%
- **Poids unitaire:** < 200KB
- **Total par produit:** < 5MB

## Test après déploiement

1. **Images légères** (< 200KB chacune) → ✅ Devrait fonctionner
2. **Images moyennes** (200-500KB) → ✅ Devrait fonctionner  
3. **Images lourdes** (> 1MB chacune) → ⚠️ Risque d'erreur 413

## Actions utilisateur recommandées

### Immédiat
1. **Compresser les images** avant upload
2. **Limiter à 3-4 images** par produit
3. **Redimensionner** si > 800px de large

### Long terme
1. Implémenter un service d'upload dédié
2. Ajouter compression automatique côté frontend
3. Migration vers stockage cloud

---

**Status:** ✅ LIMITES AUGMENTÉES (1MB → 10MB)  
**Recommandation:** Optimiser les images avant upload  
**Prochaine étape:** Tester avec images compressées