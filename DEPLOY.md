# ThèsePro — Guide de déploiement Vercel

## 1. Créer le repo GitHub

```bash
# Créer un repo privé sur github.com nommé "thesepro", puis :
git remote add origin https://github.com/TON-USERNAME/thesepro.git
git branch -M main
git push -u origin main
```

---

## 2. Importer sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → sélectionner `thesepro`
3. Framework : **Next.js** (détecté automatiquement)
4. **Ne pas déployer encore** — configurer les variables d'abord

---

## 3. Variables d'environnement (Vercel → Settings → Environment Variables)

Ajouter toutes ces variables en environnement **Production** :

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (LIVE — clés de production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   ← obtenu à l'étape 6

# Application
NEXT_PUBLIC_APP_URL=https://thesepro.fr
NEXT_PUBLIC_APP_NAME=ThèsePro

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ThèsePro <noreply@thesepro.fr>
```

---

## 4. Premier déploiement

- Cliquer **Deploy**
- Vercel génère une URL temporaire du type `thesepro-xxx.vercel.app`
- Vérifier que le build passe (doit être identique au build local)

---

## 5. Configuration Supabase

Dans **Supabase Dashboard → Authentication → URL Configuration** :

| Paramètre | Valeur |
|-----------|--------|
| Site URL | `https://thesepro.fr` |
| Redirect URLs | `https://thesepro.fr/**` |

> Ajouter aussi `https://thesepro-xxx.vercel.app/**` pendant les tests.

**Exécuter les migrations SQL** dans Supabase SQL Editor (dans l'ordre) :
```
1. supabase/schema.sql
2. supabase/sprint2-migrations.sql
3. supabase/sprint3-migrations.sql
4. supabase/sprint4-migrations.sql
5. supabase/sprint5-migrations.sql
```

---

## 6. Configuration Stripe (mode live)

### Webhook de production

Dans **Stripe Dashboard → Developers → Webhooks → Add endpoint** :

| Paramètre | Valeur |
|-----------|--------|
| Endpoint URL | `https://thesepro.fr/api/webhooks/stripe` |
| Events | `payment_intent.succeeded` |
| | `payment_intent.payment_failed` |
| | `account.updated` |

→ Copier le **Signing secret** (`whsec_...`) et l'ajouter dans Vercel comme `STRIPE_WEBHOOK_SECRET`

### Stripe Connect (live)

- Activer Stripe Connect dans Dashboard → Connect → Settings
- Vérifier que le compte plateforme est activé en mode live

---

## 7. Domaine custom

Dans **Vercel → Settings → Domains** :

1. Ajouter `thesepro.fr` et `www.thesepro.fr`
2. Vercel fournit les enregistrements DNS à configurer chez ton registrar :

```
Type  Nom    Valeur
A     @      76.76.21.21
CNAME www    cname.vercel-dns.com
```

> La propagation DNS peut prendre jusqu'à 48h.

---

## 8. Resend — Vérification du domaine

Dans **Resend Dashboard → Domains → Add Domain** :

1. Ajouter `thesepro.fr`
2. Ajouter les enregistrements DNS fournis (SPF, DKIM, DMARC)
3. Vérifier le domaine → les emails `noreply@thesepro.fr` seront opérationnels

---

## 9. Créer le premier compte admin

Après inscription d'un compte via l'interface :

```sql
-- Dans Supabase SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE id = 'UUID-DU-COMPTE-A-PROMOUVOIR';
```

Accès back-office : `https://thesepro.fr/admin/dashboard`

---

## Checklist finale avant mise en ligne

- [ ] Build Vercel passé sans erreur
- [ ] Variables d'environnement toutes renseignées en Production
- [ ] Stripe en **mode live** (clés `pk_live_` et `sk_live_`)
- [ ] Stripe Connect activé en live
- [ ] Webhook Stripe pointant vers `https://thesepro.fr/api/webhooks/stripe`
- [ ] Supabase : Site URL = `https://thesepro.fr`
- [ ] Migrations SQL exécutées (schéma + sprints 2→5)
- [ ] Domaine `thesepro.fr` DNS configuré et propagé
- [ ] Resend : domaine `thesepro.fr` vérifié, emails testés
- [ ] Test inscription + commande complète en production
- [ ] Sitemap accessible : `https://thesepro.fr/sitemap.xml`
- [ ] Compte admin créé via SQL

---

## Commandes utiles post-déploiement

```bash
# Redéployer manuellement
git push origin main   # déclenche un déploiement automatique sur Vercel

# Voir les logs en temps réel
vercel logs https://thesepro.fr --follow

# Tester le webhook Stripe en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```
