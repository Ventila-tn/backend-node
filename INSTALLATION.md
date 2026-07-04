# 📦 Installation et Démarrage

## ⚠️ Problème : "Cannot find module index.js"

Ce problème survient quand vous essayez de lancer `node index.js` directement. Ce projet utilise TypeScript et nécessite une étape d'installation.

## ✅ Solution : Installation Complète

### Étape 1 : Installer les dépendances

Ouvrez un terminal dans le dossier `backend-node` et exécutez :

```bash
npm install
```

Cette commande va installer toutes les dépendances listées dans `package.json` :
- express
- typescript
- pg (PostgreSQL client)
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- tsx (pour exécuter TypeScript directement)
- Et toutes les définitions de types (@types/...)

### Étape 2 : Démarrer le serveur

**Option A : Mode développement (recommandé)**

```bash
npm run dev
```

Cette commande :
- Lance le serveur avec rechargement automatique
- N'a pas besoin de compilation préalable
- Utilise `tsx` pour exécuter TypeScript directement

**Option B : Mode production**

```bash
# 1. Compiler TypeScript → JavaScript
npm run build

# 2. Lancer le serveur compilé
npm start
```

**Option C : Lancement rapide (sans watch)**

```bash
npm run start:dev
```

## 🎯 Commandes Disponibles

```bash
# Installation des dépendances
npm install

# Développement avec rechargement auto
npm run dev

# Lancement rapide sans watch
npm run start:dev

# Compilation TypeScript
npm run build

# Démarrage en production (après build)
npm start
```

## 📋 Checklist de démarrage

- [ ] Node.js v18+ installé (`node --version`)
- [ ] npm installé (`npm --version`)
- [ ] Terminal ouvert dans `backend-node/`
- [ ] Exécuter `npm install`
- [ ] Vérifier que `.env` existe
- [ ] Exécuter `npm run dev`
- [ ] Vérifier `http://localhost:8080/health`

## 🐛 Dépannage

### "Cannot find module"

**Problème :** Les dépendances ne sont pas installées.

**Solution :**
```bash
cd backend-node
npm install
```

### "Port 8080 is already in use"

**Problème :** Le port est déjà utilisé.

**Solutions :**
1. Arrêter l'autre application sur le port 8080
2. Ou changer le port dans `.env` : `PORT=3000`

### "Database connection failed"

**Problème :** Impossible de se connecter à PostgreSQL.

**Solution :**
1. Vérifier que l'URL dans `.env` est correcte
2. Vérifier votre connexion internet
3. Tester la connexion à Supabase

### "Command not found: tsx"

**Problème :** Les dépendances ne sont pas installées.

**Solution :**
```bash
npm install
```

### Réinstallation complète

Si vous avez des problèmes persistants :

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install

# Lancer
npm run dev
```

Sur Windows PowerShell :
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
npm run dev
```

## ✨ Vérification que tout fonctionne

Une fois le serveur lancé, vous devriez voir :

```
✓ Database connected successfully
✓ Server running on port 8080
✓ Environment: development
✓ API available at http://localhost:8080/api
```

Testez dans un autre terminal :

```bash
curl http://localhost:8080/health
```

Devrait retourner :
```json
{"status":"OK","timestamp":"2024-01-15T10:30:00.000Z"}
```

## 📚 Prochaines étapes

1. ✅ Le serveur tourne sur `http://localhost:8080`
2. 📖 Consultez [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour les endpoints
3. 🧪 Testez l'API avec les exemples dans [START.md](./START.md)
4. 🔗 Connectez votre frontend Angular

## 💡 Conseils

- **Utilisez `npm run dev`** en développement pour le rechargement automatique
- **Utilisez `npm run build && npm start`** en production
- Les logs s'affichent directement dans le terminal
- Utilisez `Ctrl+C` pour arrêter le serveur

Bon développement ! 🚀