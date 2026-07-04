# 🚀 Déploiement Rapide sur Vercel

## Méthode Rapide (Dashboard Web)

### 1️⃣ Préparer Git (si pas encore fait)

```bash
cd backend-node

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Ready for Vercel deployment"

# Créer un repo sur GitHub et le lier
git remote add origin https://github.com/VOTRE_USERNAME/backend-node.git
git branch -M main
git push -u origin main
```

### 2️⃣ Déployer sur Vercel

1. **Aller sur** [vercel.com](https://vercel.com) et se connecter avec GitHub

2. **Cliquer** sur "New Project"

3. **Importer** votre repository `backend-node`

4. **Configurer les variables d'environnement** :

   Cliquer sur **"Environment Variables"** et ajouter :

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://postgres.fnoauuxhjcbvervhkdba:ventilo-1478951@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
   | `JWT_EXPIRATION` | `86400000` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `*` |

5. **Cliquer** sur "Deploy"

6. **Attendre** 1-2 minutes

7. ✅ **C'est prêt !** Votre API est en ligne sur `https://votre-projet.vercel.app`

---

## 🧪 Tester

```bash
# Test health
curl https://votre-projet.vercel.app/health

# Test products
curl https://votre-projet.vercel.app/api/products

# Test login
curl -X POST https://votre-projet.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## 🔄 Mises à jour automatiques

Chaque fois que vous poussez sur `main`, Vercel redéploie automatiquement :

```bash
git add .
git commit -m "Update backend"
git push
```

---

## ⚠️ Important pour la Production

### Changer le JWT_SECRET

```bash
# Générer un nouveau secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copier le résultat et l'ajouter dans Vercel :
# Project Settings → Environment Variables → JWT_SECRET → Edit
```

### Restreindre CORS (optionnel)

Si vous connaissez l'URL de votre frontend :

```
CORS_ORIGIN=https://votre-frontend.vercel.app,https://www.votre-frontend.com
```

---

## 📝 Configurer votre Frontend

Mettez à jour l'URL de l'API :

```typescript
// Angular - environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://votre-projet.vercel.app/api'
};

// React - .env.production
REACT_APP_API_URL=https://votre-projet.vercel.app/api

// Vue - .env.production
VUE_APP_API_URL=https://votre-projet.vercel.app/api
```

---

C'est tout ! Votre backend est déployé et prêt à être utilisé ! 🎉
