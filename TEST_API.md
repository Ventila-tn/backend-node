# Test rapide de l'API Settings

## 1. Vérifier l'endpoint dans le navigateur
Ouvrir cette URL : https://backend-node-dun.vercel.app/api/settings/delivery-fee

**Résultat attendu :** `7`

## 2. Si l'endpoint retourne 7 mais le frontend affiche 0.00
Le problème est côté frontend. Vérifier :
- L'URL de l'API dans environment.ts
- Les erreurs dans la console du navigateur
- Le réseau dans les outils de développement

## 3. Si l'endpoint retourne autre chose
Le problème est côté backend/base de données.

## 4. Test complet
```bash
# Tester l'endpoint GET
curl https://backend-node-dun.vercel.app/api/settings/delivery-fee

# Tester l'endpoint PUT (optionnel)
curl -X PUT https://backend-node-dun.vercel.app/api/settings/delivery-fee \
  -H "Content-Type: application/json" \
  -d '{"value": 7}'
```