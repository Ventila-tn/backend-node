# 🚀 FORCE DEPLOY - Test Endpoint Images

## Problème
L'endpoint `PUT /products/{id}/images` retourne 404 alors que le code est présent.

## ✅ Vérifications faites
1. **Route configurée** ✅ `router.put('/products/:id/images', productController.updateProductImages)`
2. **Méthode existe** ✅ `updateProductImages = async (req, res) => {...}`
3. **Plus d'erreur 413** ✅ La compression fonctionne !

## 🔧 Actions requises

### 1. Force deploy Vercel
```bash
# Forcer un nouveau déploiement
vercel --prod --force

# OU faire un commit dummy pour trigger deploy
git commit --allow-empty -m "Force deploy for images endpoint"
git push origin main
```

### 2. Tester l'endpoint manuellement
```bash
# Test simple de l'endpoint
curl -X PUT https://backend-node-dun.vercel.app/api/products/1/images \
  -H "Content-Type: application/json" \
  -d '{"imageUrls":["data:image/jpeg;base64,/9j/4AAQSkZJRgABA...small_test"]}'
```

### 3. Vérifier les routes déployées
```bash
# Test de la route de base
curl https://backend-node-dun.vercel.app/api/products/1
# Doit retourner 200 avec les données du produit

# Test de la nouvelle route
curl https://backend-node-dun.vercel.app/api/products/1/images  
# Ne doit PAS retourner 404
```

## 📋 Solutions alternatives si 404 persiste

### Option A: Forcer via fichier vide
```typescript
// Créer un fichier temporaire pour forcer le redéploiement
export const FORCE_DEPLOY_TIMESTAMP = ${Date.now()};
```

### Option B: Vérifier l'ordre des routes
L'ordre des routes dans Express est important. La route spécifique doit être AVANT la route générique :
```typescript
// ✅ CORRECT
router.put('/products/:id/images', ...); // AVANT
router.put('/products/:id', ...);        // APRÈS

// ❌ INCORRECT  
router.put('/products/:id', ...);        // Capture tout
router.put('/products/:id/images', ...); // Jamais atteint
```

### Option C: Endpoint alternatif temporaire
Si le problème persiste, utiliser temporairement :
```typescript
// Endpoint alternatif
router.post('/products/:id/upload-images', productController.updateProductImages);
```

## 🎯 Test après déploiement

1. **Vérifier l'endpoint existe :**
   ```bash
   curl -I https://backend-node-dun.vercel.app/api/products/1/images
   # Doit retourner 200/400/413 mais PAS 404
   ```

2. **Tester avec vraie image :**
   - Ouvrir l'interface admin
   - Modifier un produit existant  
   - Ajouter une image
   - Vérifier les logs console

## 📊 Logs attendus après fix

### Si l'endpoint fonctionne :
```
📸 Image très compressée: 89KB (depuis 2048KB)
💾 Upload de 1 image(s) une par une...
📤 Upload image 1/1 (89KB)
✅ Image 1 uploadée
```

### Si l'endpoint ne fonctionne toujours pas :
```
❌ Erreur upload image 1: HttpErrorResponse {status: 404}
```

---

**Action immédiate :** Force deploy puis tester l'endpoint manuellement