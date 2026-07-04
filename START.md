# 🚀 Guide de Démarrage Rapide

## Prérequis

- Node.js v18+ installé
- npm ou yarn
- PostgreSQL (Supabase déjà configuré)

## Installation

### 1. Installer les dépendances

```bash
cd backend-node
npm install
```

### 2. Configuration

Le fichier `.env` est déjà configuré avec les credentials Supabase :

```env
DATABASE_URL=postgresql://postgres.fnoauuxhjcbvervhkdba:ventilo-1478951@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION=86400000
PORT=8080
NODE_ENV=development
CORS_ORIGIN=*
```

### 3. Démarrer le serveur

**Mode développement (avec rechargement automatique) :**
```bash
npm run dev
```

**Build et production :**
```bash
npm run build
npm start
```

## ✅ Vérification

Le serveur démarre sur `http://localhost:8080`

### Test de connexion

```bash
# Health check
curl http://localhost:8080/health

# Devrait retourner :
# {"status":"OK","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Test des endpoints publics

```bash
# Obtenir les produits
curl http://localhost:8080/api/products

# Créer un log
curl -X POST http://localhost:8080/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "logType": "INFO",
    "message": "Test log",
    "details": {},
    "userAgent": "curl",
    "pageUrl": "/test"
  }'
```

### Test de l'authentification

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "role": "ROLE_CLIENT"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

## 📊 Logs du serveur

Lorsque le serveur démarre, vous devriez voir :

```
✓ Database connected successfully
✓ Server running on port 8080
✓ Environment: development
✓ API available at http://localhost:8080/api
```

## 🔧 Scripts disponibles

```bash
# Développement avec rechargement automatique
npm run dev

# Build TypeScript -> JavaScript
npm run build

# Démarrer en production (après build)
npm start

# Linter (si configuré)
npm run lint
```

## 🐛 Dépannage

### Erreur de connexion à la base de données

Si vous obtenez une erreur de connexion :
1. Vérifiez que l'URL de la base de données est correcte dans `.env`
2. Vérifiez votre connexion internet
3. Vérifiez que Supabase est accessible

### Port déjà utilisé

Si le port 8080 est déjà utilisé :
1. Changez le port dans `.env` : `PORT=3000`
2. Ou arrêtez l'application qui utilise le port 8080

### Modules non trouvés

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Liste complète des endpoints
- [README.md](./README.md) - Vue d'ensemble du projet
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide de migration Spring Boot → Node.js

## 🎯 Prochaines étapes

1. ✅ Vérifier que tous les endpoints fonctionnent
2. ✅ Tester la création de produits
3. ✅ Tester le système de stock (FIFO)
4. ✅ Tester les commandes avec déduction de stock
5. ✅ Tester l'annulation de commande (restauration du stock)

## 🔐 Utilisateurs par défaut

Si vous avez exécuté `DataInitializer` du Spring Boot, vous devriez avoir :
- Username: `admin` / Password: `admin` (ROLE_ADMIN)

Sinon, créez-en un avec l'endpoint `/api/auth/register`.

## 🌐 Compatibilité Frontend

Ce backend est **100% compatible** avec le frontend Angular existant. Il suffit de changer l'URL de base de l'API :

Dans votre frontend Angular :
```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:8080/api'  // Au lieu du port Spring Boot (8080)
};
```

## ✨ Fonctionnalités

- ✅ Authentification JWT
- ✅ CRUD Produits avec calcul automatique du prix TTC
- ✅ Gestion du stock (FIFO)
- ✅ Passation de commandes
- ✅ Annulation avec restauration du stock
- ✅ Logs avec capture de l'IP
- ✅ Catégories hiérarchiques
- ✅ CORS configuré (*  comme Spring Boot)
- ✅ Transactions SQL pour les opérations critiques

Bon développement ! 🚀
