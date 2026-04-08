# ThèsePro — Standards de développement

## Stack
Next.js 14 App Router, TypeScript, Supabase, Stripe Connect, Tailwind CSS, shadcn/ui

## Règles de code
- TypeScript strict mode : toujours typer les props et retours de fonctions
- Composants : Server Components par défaut, 'use client' uniquement si nécessaire
- Nommage : PascalCase pour composants, camelCase pour fonctions, kebab-case pour fichiers
- Formulaires : React Hook Form + Zod pour validation
- Data fetching : TanStack Query pour les mutations et requêtes côté client
- Erreurs : toujours gérer les cas d'erreur avec toast notifications (Sonner)

## Supabase
- Toujours utiliser le client Supabase côté serveur pour les Server Components
- Activer RLS sur TOUTES les tables — ne jamais désactiver RLS en production
- Types générés automatiquement : npx supabase gen types typescript

## Sécurité
- Jamais de clé API en dur dans le code
- Validation de tous les inputs avec Zod
- Vérifier l'authentification dans chaque API route
