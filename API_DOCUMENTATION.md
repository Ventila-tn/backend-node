# Documentation API - E-commerce Backend Node.js

## 🌐 Base URL
```
http://localhost:8080/api
```

## 🔐 Authentification

La plupart des endpoints nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

---

## � Endpoints

### 🔑 Authentification

#### Register
```http
POST /api/auth/register
```

**Body:**
```json
{
  "username": "user123",
  "password": "password123",
  "role": "ROLE_CLIENT"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 📦 Produits

#### Obtenir tous les produits actifs
```http
GET /api/products
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Produit 1",
    "description": "Description",
    "purchasePriceHT": 10.5,
    "profitMarginPercent": 20,
    "vatPercent": 19,
    "sellingPriceTTC": 15.03,
    "stockQuantity": 100,
    "active": true,
    "characteristics": {
      "couleur": "rouge",
      "taille": "M"
    },
    "imageUrls": []
  }
]
```

#### Obtenir les produits archivés
```http
GET /api/products/archived
```

#### Obtenir un produit par ID
```http
GET /api/products/:id
```

#### Créer un produit
```http
POST /api/products
```

**Body:**
```json
{
  "name": "Nouveau Produit",
  "description": "Description du produit",
  "purchasePriceHT": 10.0,
  "profitMarginPercent": 20.0,
  "vatPercent": 19.0,
  "characteristics": {
    "couleur": "bleu",
    "taille": "L"
  },
  "imageUrls": []
}
```

**Response:** Product DTO

#### Mettre à jour un produit
```http
PUT /api/products/:id
```

**Body:** Identique à POST

#### Archiver un produit
```http
DELETE /api/products/:id
```

**Response:** 204 No Content

#### Réactiver un produit
```http
POST /api/products/:id/reactivate
```

**Response:** Product DTO

---

### 📂 Catégories

#### Obtenir toutes les catégories
```http
GET /api/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Électronique",
    "parent_id": null
  },
  {
    "id": 2,
    "name": "Smartphones",
    "parent_id": 1
  }
]
```

#### Créer une catégorie
```http
POST /api/categories
```
🔒 Authentification requise

**Body:**
```json
{
  "name": "Nouvelle Catégorie",
  "parent_id": 1
}
```

#### Supprimer une catégorie
```http
DELETE /api/categories/:id
```
🔒 Authentification requise

---

### 🛒 Commandes

#### Passer une commande (Checkout)
```http
POST /api/orders/checkout
```

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "address": "123 Rue de la Paix",
  "phone": "0612345678",
  "email": "jean@example.com",
  "city": "Paris",
  "governorate": "Île-de-France",
  "deliveryFee": 5.0,
  "items": {
    "1": 2,
    "3": 1
  }
}
```

**Response:**
```json
{
  "id": 1,
  "order_date": "2024-01-15T10:30:00",
  "status": "PENDING_CONFIRMATION",
  "total_amount": 35.5,
  "has_stock_shortage": false,
  "first_name": "Jean",
  "last_name": "Dupont",
  "address": "123 Rue de la Paix",
  "phone": "0612345678",
  "email": "jean@example.com",
  "city": "Paris",
  "governorate": "Île-de-France",
  "delivery_fee": 5.0
}
```

#### Obtenir toutes les commandes
```http
GET /api/orders
```
🔒 Authentification requise

#### Obtenir une commande par ID
```http
GET /api/orders/:id
```
🔒 Authentification requise

#### Obtenir les articles d'une commande
```http
GET /api/orders/:id/items
```
🔒 Authentification requise

**Response:**
```json
[
  {
    "id": 1,
    "order_id": 1,
    "product_id": 1,
    "quantity": 2,
    "unit_price": 15.03,
    "total_price": 30.06
  }
]
```

#### Mettre à jour le statut d'une commande
```http
PUT /api/orders/:id/status
```
🔒 Authentification requise

**Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Statuts disponibles:**
- `PENDING_CONFIRMATION`
- `CONFIRMED`
- `PREPARING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

---

### 📊 Stock

#### Enregistrer une entrée de stock
```http
POST /api/stock/inbound
```
🔒 Authentification requise

**Body:**
```json
{
  "productId": 1,
  "batchNumber": "LOT-2024-001",
  "quantity": 100,
  "unitPrice": 10.5,
  "expirationDate": "2025-12-31",
  "reason": "Réapprovisionnement"
}
```

#### Obtenir le stock total d'un produit
```http
GET /api/stock/product/:productId/total
```

**Response:**
```json
150
```

#### Obtenir tous les mouvements de stock
```http
GET /api/stock/movements
```
🔒 Authentification requise

**Response:**
```json
[
  {
    "id": 1,
    "movementDate": "2024-01-15T10:30:00",
    "type": "IN",
    "quantity": 100,
    "unitPrice": 10.5,
    "reason": "Réapprovisionnement",
    "productId": 1,
    "productName": "Produit 1",
    "batchNumber": "LOT-2024-001"
  }
]
```

#### Obtenir les mouvements de stock d'un produit
```http
GET /api/stock/movements/product/:productId
```
🔒 Authentification requise

#### Obtenir les statistiques de stock d'un produit
```http
GET /api/stock/product/:productId/stats
```
🔒 Authentification requise

**Response:**
```json
{
  "totalUnits": 150,
  "averagePurchasePrice": 10.75,
  "totalPurchaseValue": 1612.5
}
```

#### Obtenir le dernier prix d'achat d'un produit
```http
GET /api/stock/product/:productId/latest-price
```
🔒 Authentification requise

**Response:**
```json
10.5
```

---

### 📝 Logs

#### Créer un log
```http
POST /api/logs
```

**Body:**
```json
{
  "logType": "ERROR",
  "message": "Une erreur s'est produite",
  "details": {
    "error": "Connection timeout",
    "code": 500
  },
  "userAgent": "Mozilla/5.0...",
  "pageUrl": "/products"
}
```

#### Obtenir tous les logs
```http
GET /api/logs
```

**Query Parameters (optionnels):**
- `logType` - Filtrer par type
- `ipAddress` - Filtrer par IP
- `startDate` - Date de début (ISO 8601)
- `endDate` - Date de fin (ISO 8601)

**Exemple:**
```http
GET /api/logs?logType=ERROR&startDate=2024-01-01T00:00:00
```

#### Obtenir les logs par type
```http
GET /api/logs/type/:logType
```

**Exemple:**
```http
GET /api/logs/type/ERROR
```

#### Obtenir toutes les adresses IP distinctes
```http
GET /api/logs/ips
```

**Response:**
```json
[
  "192.168.1.1",
  "192.168.1.2"
]
```

---

## 🔧 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## ⚠️ Gestion des Erreurs

Toutes les erreurs suivent le format suivant :

```json
{
  "error": {
    "message": "Description de l'erreur",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/products/999"
  }
}
```

**Codes HTTP courants:**
- `200` - Succès
- `201` - Créé
- `204` - Pas de contenu
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Ressource non trouvée
- `500` - Erreur serveur

---

## 💡 Exemples d'utilisation

### Flux complet : Créer un produit et passer une commande

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Réponse : {"token":"eyJhbGc..."}

# 2. Créer un produit
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "Gaming laptop",
    "purchasePriceHT": 500,
    "profitMarginPercent": 30,
    "vatPercent": 19,
    "characteristics": {},
    "imageUrls": []
  }'

# 3. Ajouter du stock
curl -X POST http://localhost:8080/api/stock/inbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 1,
    "batchNumber": "LOT-001",
    "quantity": 10,
    "unitPrice": 500,
    "expirationDate": null,
    "reason": "Initial stock"
  }'

# 4. Passer une commande
curl -X POST http://localhost:8080/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "phone": "1234567890",
    "email": "john@example.com",
    "items": {
      "1": 2
    }
  }'
```

---

## 🔄 Logique Métier Importante

### Calcul du prix de vente TTC
```
Prix HT × (1 + Marge/100) × (1 + TVA/100)
```

**Exemple:**
- Prix HT : 10€
- Marge : 20%
- TVA : 19%
- **Prix TTC = 10 × 1.20 × 1.19 = 14.28€**

### Gestion du stock FIFO
Les sorties de stock utilisent l'algorithme **FIFO (First In, First Out)** :
- Les lots les plus anciens sont utilisés en premier
- Tri par date d'expiration (les produits qui périment le plus tôt partent en premier)

### Annulation de commande
Lors de l'annulation d'une commande (`status: CANCELLED`), le stock est automatiquement restauré avec un lot de type `RESTORE-{orderId}`.
