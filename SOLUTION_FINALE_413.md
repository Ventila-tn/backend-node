# 🚨 SOLUTION FINALE - Error 413 Vercel

## Problème confirmé
Vercel a des limites **STRICTES** au niveau infrastructure (~4-5MB) qui ne peuvent pas être contournées par configuration. L'erreur 413 se produit AVANT que la requête atteigne notre code.

## ✅ Solutions implémentées

### 1. Validation préemptive
- Middleware qui vérifie `Content-Length` avant traitement
- Limite sécurisée à 2MB pour éviter les rejets Vercel
- Réponse explicite avec instructions

### 2. Endpoint forcé à être léger
- `PUT /api/products/{id}` rejette les gros payloads d'images
- Force l'utilisation de `PUT /api/products/{id}/images`
- Calcul automatique de la taille des images base64

### 3. Limites Express réduites
- 10MB → 3MB pour être en dessous des limites Vercel
- Évite les timeouts et rejets

## 🎯 Comment utiliser maintenant

### Option A: Images séparées (Recommandé)
```typescript
// 1. Mettre à jour le produit SANS images
await updateProduct(id, {
  name: "Nouveau nom",
  description: "Description",
  // PAS d'imageUrls ici
});

// 2. Uploader les images séparément
await updateProductImages(id, {
  imageUrls: [base64Image1, base64Image2]
});
```

### Option B: Images très légères uniquement
```typescript
// Seulement si images < 100KB chacune
await updateProduct(id, {
  name: "Nouveau nom", 
  imageUrls: [smallImage] // < 2MB total
});
```

## 📋 Messages d'erreur explicites

### Si payload trop gros (backend répond maintenant)
```json
{
  "error": "Payload too large",
  "message": "Utilisez l'endpoint /images ou compressez davantage",
  "maxSize": 2097152,
  "receivedSize": 5242880,
  "recommendation": "Utilisez PUT /api/products/{id}/images"
}
```

### Si images trop lourdes dans updateProduct
```json
{
  "error": "Images too large", 
  "message": "Utilisez l'endpoint /products/{id}/images pour uploader séparément",
  "suggestedEndpoint": "/api/products/1/images",
  "imageCount": 3,
  "estimatedSize": "4096 KB"
}
```

## 🚀 Actions immédiates utilisateur

### Pour contourner l'erreur 413 MAINTENANT

1. **Compresser drastiquement les images**
   - Largeur max: 600px
   - Qualité JPEG: 50-60%
   - Poids unitaire: < 50KB

2. **Limiter le nombre d'images**
   - Max 2-3 images par produit
   - Supprimer les images non essentielles

3. **Utiliser l'endpoint séparé**
   - Modifier d'abord sans images
   - Ajouter les images ensuite

### Exemple concret
```bash
# ✅ Ceci va marcher
curl -X PUT "/api/products/1" \
  -d '{"name":"Test","description":"OK"}'

# ✅ Puis ceci séparément  
curl -X PUT "/api/products/1/images" \
  -d '{"imageUrls":["data:image/jpeg;base64,small_image"]}'

# ❌ Ceci donnera 413
curl -X PUT "/api/products/1" \
  -d '{"name":"Test","imageUrls":["data:image/jpeg;base64,huge_image"]}'
```

## 💡 Recommandations long terme

1. **Service externe obligatoire** (Cloudinary, AWS S3)
2. **Compression automatique** côté frontend
3. **Upload progressif** par chunks
4. **Format WebP** au lieu de JPEG

---

**Status:** ✅ BACKEND ADAPTÉ AUX LIMITES VERCEL  
**Action:** Utiliser images légères ou endpoint séparé  
**Objectif:** Éliminer définitivement l'erreur 413