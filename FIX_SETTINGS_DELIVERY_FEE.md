# Fix Settings Delivery Fee - Solution Finale

## Problème Identifié

Angular HttpClient envoie un nombre primitif directement:
```typescript
this.http.put<number>(url, 8)  // Envoie: 8 (not {value: 8})
```

Mais Express `express.json()` middleware ne parse PAS les primitives JSON - il attend un objet JSON:
```json
{"value": 8}  // ✅ Fonctionne
8              // ❌ Ne fonctionne pas
```

## Solution Implémentée

### 1. Frontend Admin - Wrapper le nombre
**Fichier**: `frontend-admin/src/app/core/services/setting.service.ts`

**Avant**:
```typescript
updateDeliveryFee(fee: number): Observable<number> {
    return this.http.put<number>(`${this.apiUrl}/delivery-fee`, fee);
}
```

**Après**:
```typescript
updateDeliveryFee(fee: number): Observable<number> {
    return this.http.put<number>(`${this.apiUrl}/delivery-fee`, { value: fee });
}
```

### 2. Backend - Accepter `{value: number}`
**Fichier**: `backend-node/src/controllers/SettingsController.ts`

Le controller accepte maintenant:
- `{ value: 8 }` - Format attendu ✅
- `{ fee: 8 }` - Alternative
- `"8"` - String fallback
- `8` - Number fallback (rare)

**Code**:
```typescript
if ('value' in req.body) {
    fee = parseFloat(req.body.value);
} else if ('fee' in req.body) {
    fee = parseFloat(req.body.fee);
}
```

## Test

### Avant déploiement (local):
```bash
cd backend-node
npm run dev
```

Puis dans un autre terminal:
```bash
curl -X PUT http://localhost:8080/api/settings/delivery-fee \
  -H "Content-Type: application/json" \
  -d '{"value": 8}'
```

Réponse attendue: `8`

### Après déploiement (Vercel):
1. Aller sur frontend-admin: http://localhost:4201/settings
2. Changer le prix à `8.00`
3. Cliquer "Enregistrer"
4. Devrait afficher: "✓ Frais de livraison mis à jour avec succès."

## Logs de Débogage

Le backend log maintenant:
```
Received body: {"value":8} Type: object
Content-Type: application/json
Parsed fee: 8
Successfully saved delivery fee: 8
```

Si échec, les logs montreront exactement ce qui a été reçu et pourquoi ça a échoué.

## Format API Standard

**Request**:
```http
PUT /api/settings/delivery-fee
Content-Type: application/json

{"value": 8}
```

**Response**:
```http
200 OK
Content-Type: application/json

8
```

## Compatibilité

Cette solution est compatible avec:
- ✅ Angular HttpClient
- ✅ Fetch API
- ✅ Axios
- ✅ curl
- ✅ Postman

## Frontend Client

Pour le frontend client, utiliser le même format:

**Fichier**: `frontend-client/src/app/core/services/setting.service.ts`

Déjà créé avec le bon format (pas de modification nécessaire car il n'a pas de PUT, seulement GET).
