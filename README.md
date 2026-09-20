# ERP Maarif — Web

Interface Next.js (App Router) pour l'ERP Maarif : espace personnel (administrateurs, enseignants) et portail parent, consommant l'[API Laravel](../backend).

## Structure

```
src/
  app/
    connexion/                staff login (public)
    portail/connexion/        parent login (public)
    (staff)/                  espace personnel, protege par RequireAuth
      tableau-de-bord/ eleves/ notes/ presences/ discipline/ classes/ matieres/ trimestres/ utilisateurs/
    portail/(app)/             portail parent, protege par RequireAuth
      bulletin/ presences/ convocations/ sanctions/
  components/
    ui/          design system (Button, Card, SearchInput, DataTable, ...)
    layout/      sidebars et topbars des deux espaces
    auth/        RequireAuth (garde de route cote client)
    staff/       StudentPicker (recherche d'eleve reutilisee par notes/presences/discipline)
  lib/
    api/         client Axios + un module par ressource (students, grades, attendance, ...)
    auth/        store Zustand (session persistee) + verification des permissions
    validation/  schemas Zod par formulaire
    hooks/       usePaginatedResource, useDebouncedValue, options de selects
```

## Design system

- Boutons et champs de recherche : `rounded-full`.
- Cartes : `rounded-md` avec une bordure superieure de 4px coloree par domaine (`accent="grades" | "attendance" | "discipline" | "academics" | "users"`), pour identifier un contenu d'un coup d'oeil dans un tableau de bord qui melange plusieurs types d'information.

Voir `src/app/globals.css` pour les jetons de couleur et `src/components/ui/`.

## Mise en route

```bash
npm install
cp .env.local.example .env.local   # ajuster NEXT_PUBLIC_API_URL si besoin
npm run dev
```

## Tests

```bash
npm run test            # Vitest (unitaires + integration, MSW pour l'API)
npm run test:watch
npm run test:coverage
npm run lint
npm run build            # verifie aussi le typage TypeScript
```

Les tests d'integration (pages de connexion, liste des eleves) mockent l'API via [MSW](https://mswjs.io) — voir `src/test/msw/`.
# ERP-MAARIF-WEB
