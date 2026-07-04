# 🚀 Guide de Déploiement sur Vercel

## 📋 Prérequis

- Compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- Vercel CLI installé (optionnel) : `npm i -g vercel`
- Base de données Supabase accessible depuis internet

## 🔧 Configuration du Projet

### 1. Fichiers de Configuration Vercel

Les fichiers suivants ont été ajoutés pour Vercel :

#### `vercel.json`
Configure Vercel pour utiliser Node.js et router toutes les requêtes vers l'application Express.

#### `.vercelignore`
Exclut les fichiers inutiles du déploiement.

#### `src/index.ts` (modifié)
- Détecte automatiquement l'environnement Vercel
- Exporte l'app Express pour Vercel
- Garde la fonctionnalité locale inchangée

## 🌐 Méthodes de Déploiement

### Méthode 1 : Via le Dashboard Vercel (Recommandé)

#### Étape 1 : Préparer le Repository Git

```bash
# Si pas encore un repo Git
cd backend-node
git init
git add .
git commit -m "Initial commit - Backend Node.js"

# Pusher vers GitHub/GitLab/Bitbucket
git remote add origin https://github.com/votre-username/votre-repo.git
git branch -M main
git push -u origin main
```

#### Étape 2 : Importer sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur **"New Project"**
3. Importer votre repository Git
4. Vercel détectera automatiquement qu'il s'agit d'un projet Node.js

#### Étape 3 : Configuration des Variables d'Environnement

Dans les **Project Settings → Environment Variables**, ajouter :

```env
DATABASE_URL=postgresql://postgres.fnoauuxhjcbvervhkdba:ventilo-1478951@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require

JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

JWT_EXPIRATION=86400000

NODE_ENV=production

CORS_ORIGIN=*

PORT=8080
```

**⚠️ Important :** 
- Ne PAS commiter le fichier `.env` dans Git
- Configurer les variables directement dans Vercel

#### Étape 4 : Déployer

1. Cliquer sur **"Deploy"**
2. Attendre la fin du build (~1-2 minutes)
3. Votre API sera disponible sur `https://votre-projet.vercel.app`

---

### Méthode 2 : Via Vercel CLI

#### Étape 1 : Installer Vercel CLI

```bash
npm i -g vercel
```

#### Étape 2 : Login

```bash
vercel login
```

#### Étape 3 : Déployer

```bash
cd backend-node

# Premier déploiement (mode interactif)
vercel

# Ou directement en production
vercel --prod
```

#### Étape 4 : Configurer les Variables d'Environnement

```bash
# Ajouter les variables une par une
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRATION production
vercel env add NODE_ENV production
vercel env add CORS_ORIGIN production
```

Ou via le fichier `.env` (ne pas commiter) :

```bash
# Créer .env.production
cat > .env.production << EOF
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRATION=86400000
NODE_ENV=production
CORS_ORIGIN=*
EOF

# Importer toutes les variables
vercel env pull .env.production
```

---

## 🧪 Tester le Déploiement

### 1. Health Check

```bash
curl https://votre-projet.vercel.app/health
```

Devrait retourner :
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Tester l'API

```bash
# Obtenir les produits
curl https://votre-projet.vercel.app/api/products

# Login
curl -X POST https://votre-projet.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## 🔄 Déploiements Automatiques

Une fois connecté à Git, Vercel déploie automatiquement :
- **Production** : À chaque push sur la branche `main`
- **Preview** : À chaque pull request (environnement de test)

---

## ⚙️ Configuration Avancée

### Custom Domain

1. Aller dans **Project Settings → Domains**
2. Ajouter votre domaine personnalisé
3. Configurer les DNS selon les instructions Vercel

### Variables d'Environnement par Environnement

Vercel permet de définir des variables pour :
- **Production** : Utilisées en production
- **Preview** : Utilisées pour les previews (PRs)
- **Development** : Utilisées localement avec `vercel dev`

### Limites Vercel (Plan Gratuit)

- ✅ 100 GB de bande passante / mois
- ✅ Déploiements illimités
- ✅ HTTPS automatique
- ✅ CDN global
- ⚠️ Timeout : 10 secondes par requête (serverless)
- ⚠️ 12 déploiements / heure max

---

## 🐛 Dépannage

### Erreur : "DATABASE_URL is not defined"

**Solution :** Vérifier que les variables d'environnement sont bien configurées dans Vercel.

```bash
# Via CLI
vercel env ls
```

### Erreur : "Module not found"

**Solution :** Vérifier que toutes les dépendances sont dans `dependencies` (pas `devDependencies`) :

```bash
npm install --save express pg cors jsonwebtoken bcryptjs dotenv
```

### Erreur de Connexion Base de Données

**Solution :** Vérifier que :
1. L'URL Supabase est correcte
2. Supabase autorise les connexions depuis Vercel
3. Le mode SSL est configuré (`sslmode=require`)

### Timeout (> 10 secondes)

**Solution :** Les fonctions serverless Vercel ont un timeout de 10s (gratuit).
- Optimiser les requêtes SQL
- Ajouter des index en base
- Ou upgrader vers un plan payant (60s timeout)

---

## 📊 Monitoring

### Logs Vercel

```bash
# Via CLI
vercel logs

# Ou dans le dashboard
# Project → Deployments → [Deployment] → Logs
```

### Métriques

Dashboard Vercel affiche :
- Nombre de requêtes
- Temps de réponse
- Taux d'erreur
- Utilisation de la bande passante

---

## 🔐 Sécurité

### Variables d'Environnement

- ✅ Stockées de manière sécurisée par Vercel
- ✅ Chiffrées au repos
- ✅ Jamais exposées dans les logs

### HTTPS

- ✅ HTTPS automatique avec certificats Let's Encrypt
- ✅ Renouvelé automatiquement

### Recommandations

1. **Changer le JWT_SECRET** en production :
   ```bash
   # Générer un nouveau secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Restreindre CORS** si nécessaire :
   ```env
   CORS_ORIGIN=https://votre-frontend.com,https://www.votre-frontend.com
   ```

3. **Configurer des rate limits** (via middleware Express)

---

## 🎯 Checklist de Déploiement

- [ ] Repository Git créé et pushé
- [ ] Compte Vercel créé
- [ ] Projet importé dans Vercel
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Health check fonctionne
- [ ] API endpoints testés
- [ ] CORS configuré correctement
- [ ] JWT_SECRET changé pour la production
- [ ] Frontend configuré avec la nouvelle URL API

---

## 🌐 URL de Production

Une fois déployé, votre API sera accessible sur :

```
https://votre-projet.vercel.app
```

Endpoints :
- Health : `https://votre-projet.vercel.app/health`
- API : `https://votre-projet.vercel.app/api/*`

---

## 📝 Configuration Frontend

Mettez à jour l'URL de l'API dans votre frontend Angular :

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://votre-projet.vercel.app/api'
};
```

---

## 🚀 Prochaines Étapes

1. ✅ Déployer sur Vercel
2. ✅ Tester tous les endpoints
3. ✅ Configurer le domaine personnalisé (optionnel)
4. ✅ Mettre à jour le frontend
5. ✅ Activer les déploiements automatiques
6. ✅ Configurer le monitoring

Bon déploiement ! 🎉
