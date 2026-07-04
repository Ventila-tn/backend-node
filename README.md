# E-commerce Backend - Node.js

Migration complète du backend Spring Boot vers Node.js avec Express et TypeScript, conservant exactement la même architecture et logique métier.

## 🏗️ Architecture

### Stack Technique
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Langage:** TypeScript
- **Base de données:** PostgreSQL (Supabase)
- **ORM:** pg (node-postgres) - Requêtes SQL natives
- **Authentification:** JWT + bcryptjs
- **Validation:** express-validator

### Structure du projet
```
backend-node/
├── src/
│   ├── config/          # Configuration (database, env)
│   ├── types/           # Types TypeScript & DTOs
│   ├── middleware/      # Auth, error handling
│   ├── services/        # Logique métier
│   │   ├── AuthService.ts
│   │   ├── ProductService.ts
│   │   ├── OrderService.ts
│   │   ├── StockService.ts
│   │   └── LogService.ts
│   ├── controllers/     # Contrôleurs REST
│   │   ├── AuthController.ts
│   │   ├── ProductController.ts
│   │   ├── OrderController.ts
│   │   ├── StockController.ts
│   │   ├── CategoryController.ts
│   │   └── LogController.ts
│   ├── routes/          # Définition des routes
│   └── index.ts         # Point d'entrée
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 📋 Fonctionnalités

### ✅ Implémentées (identiques au Spring Boot)

1. **Gestion des produits**
   - Calcul automatique du prix TTC : `purchasePriceHT * (1 + margin/100) * (1 + vat/100)`
   - CRUD complet avec activation/désactivation
   - Support des caractéristiques JSONB

2. **Gestion des stocks**
   - Entrées de stock par lots (batch)
   - Sorties FIFO (First In, First Out)
   - Traçabilité complète des mouvements
   - Statistiques (stock total, prix moyen, valeur totale)

3. **Gestion des commandes**
   - Checkout avec déduction automatique du stock
   - Gestion des ruptures de stock
   - Annulation avec restauration du stock
   - Mise à jour du statut

4. **Authentification & Sécurité**
   - JWT avec expiration configurable
   - Hachage bcrypt des mots de passe
   - Middleware d'authentification
   - Gestion des rôles (ADMIN, CLIENT, MANAGER)

5. **Logs & Audit**
   - Capture de l'IP client
   - Filtrage par type, IP, date
   - User-agent et page URL

6. **Catégories**
   - Structure hiérarchique (parent/sous-catégories)

## 🚀 Installation

### Prérequis
- Node.js v18+ et npm
- PostgreSQL (Supabase)

### Étapes

1. **Installer les dépendances**
```bash
cd backend-node
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

Variables requises :
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000
PORT=8080
NODE_ENV=development
CORS_ORIGIN=*
```

3. **Lancer en développement**
```bash
npm run dev
```

4. **Build pour production**
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentification (Public)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Produits
- `GET /api/products` - Liste des produits actifs
- `GET /api/products/archived` - Produits archivés
- `GET /api/products/:id` - Détail d'un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Archiver un produit
- `POST /api/products/:id/reactivate` - Réactiver un produit

### Commandes
- `POST /api/orders/checkout` - Passer une commande
- `GET /api/orders` 🔒 - Liste des commandes
- `GET /api/orders/:id` 🔒 - Détail d'une commande
- `GET /api/orders/:id/items` 🔒 - Articles d'une commande
- `PUT /api/orders/:id/status` 🔒 - Mettre à jour le statut

### Stock
- `POST /api/stock/inbound` 🔒 - Entrée de stock
- `GET /api/stock/product/:productId/total` - Stock total
- `GET /api/stock/movements` 🔒 - Historique des mouvements
- `GET /api/stock/movements/product/:productId` 🔒 - Mouvements par produit
- `GET /api/stock/product/:productId/stats` 🔒 - Statistiques stock
- `GET /api/stock/product/:productId/latest-price` 🔒 - Dernier prix d'achat

### Catégories
- `GET /api/categories` - Liste des catégories
- `POST /api/categories` 🔒 - Créer une catégorie
- `DELETE /api/categories/:id` 🔒 - Supprimer une catégorie

### Logs
- `POST /api/logs` - Créer un log
- `GET /api/logs` - Liste des logs (avec filtres)
- `GET /api/logs/type/:logType` - Logs par type
- `GET /api/logs/ips` - Liste des IPs distinctes

🔒 = Authentification requise (JWT Bearer token)

## 🔄 Différences avec Spring Boot

### Similitudes (100% compatibles)
- Même logique métier
- Même calcul des prix
- Même gestion du stock FIFO
- Même algorithme JWT
- Même structure de base de données

### Adaptations techniques
- Utilisation de `pg` (requêtes SQL) au lieu de JPA/Hibernate
- Middleware Express au lieu de Spring Security Filters
- TypeScript interfaces au lieu de Java POJOs
- Gestion manuelle des transactions SQL
- Pas de migration automatique du schéma (Spring JPA DDL auto)

## 🔐 Sécurité

- **JWT** avec clé secrète et expiration configurable
- **bcrypt** pour le hachage des mots de passe (10 rounds)
- **CORS** configuré
- **Validation** des entrées
- **Transactions SQL** pour les opérations critiques
- **Protection** des routes avec middleware d'authentification

## 🧪 Tests

Pour tester l'API :
```bash
# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get products
curl http://localhost:8080/api/products
```

## 📊 Base de données

Le schéma correspond exactement aux tables Supabase existantes :
- users
- products
- categories
- orders
- order_items
- stock_batches
- stock_movements
- log_entries
- settings

Pas besoin de migration - utilise la base existante directement.

## 🤝 Compatibilité Frontend

Les réponses API sont 100% compatibles avec le frontend Angular existant. Seule l'URL de base de l'API doit être changée.
