# ERP Maarif — Web

Interface Next.js (App Router) pour l'ERP Maarif : espace personnel (administrateurs, enseignants, comptables) et portail parent, consommant l'[API Laravel](../backend).

## Structure

```
src/
  app/
    connexion/                staff login (public)
    portail/connexion/        parent login (public)
    (staff)/                  espace personnel, protege par RequireAuth
      tableau-de-bord/ eleves/ classes/ matieres/ trimestres/ (+ [id] : detail d'un trimestre) notes/
      presences/ (appel de classe) absences/ discipline/ comptabilite/ (paiements, impayes, frais)
      utilisateurs/ profil/ parametres/
    portail/(app)/             portail parent, protege par RequireAuth
      bulletin/ presences/ convocations/ sanctions/ scolarite/ profil/ parametres/
  components/
    ui/          design system (Button, Card, DataTable, Tabs, PeriodFilter, StatCard, ...)
    layout/      AppShell = Sidebar (groupee, reductible) + Topbar (bascule, theme, menu du profil)
    theme/       ThemeToggle, ThemeSync (themes Light / Blue Dark)
    auth/        RequireAuth (garde de route cote client)
    staff/       StudentPicker, StudentEnrollments, onglets du detail d'un trimestre
    accounting/  releve de scolarite (utilise par le personnel et par le portail parent)
  lib/
    api/         client Axios + un module par ressource (students, grades, attendance, ...)
    auth/        store Zustand (session persistee) + verification des permissions
    validation/  schemas Zod par formulaire
    hooks/       usePaginatedResource, usePagination, useDebouncedValue, options de selects
    period/      usePeriodFilter : annee scolaire / trimestre / mois, partage entre les ecrans
    theme/       preference de theme, script anti-clignotement
    layout/      etat de la barre laterale (reduite ou non)
```

## Design system

- Boutons et champs de recherche : `rounded-full`.
- Cartes : `rounded-md` avec une bordure superieure de 4px coloree par domaine (`accent="grades" | "attendance" | "discipline" | "academics" | "users" | "accounting"`), pour identifier un contenu d'un coup d'oeil dans un tableau de bord qui melange plusieurs types d'information.

Voir `src/app/globals.css` pour les jetons de couleur et `src/components/ui/`.

### Themes

Deux themes, **Light** et **Blue Dark**, definis par l'attribut `data-theme` de `<html>` (jetons dans `globals.css`, variant Tailwind `dark:` branche dessus). Tant que l'utilisateur n'a rien choisi, le theme suit celui du systeme ; le bouton de la barre du haut et la page *Parametres* (Light / Blue Dark / Automatique) enregistrent son choix (`localStorage`, cle `erp-maarif-theme`). Un petit script dans `<head>` (`NO_FLASH_SCRIPT`) pose le theme avant le premier rendu : pas de clignotement.

### Navigation

`components/layout/nav.ts` declare le menu par groupes (General, Eleves & classes, Pedagogie, Vie scolaire, Comptabilite, Administration), filtres par permission : un groupe sans entree autorisee disparait. La barre laterale est `sticky` a hauteur d'ecran : seule la navigation defile, le logo et le profil restent fixes. Elle se reduit a ses icones depuis le bouton en haut a gauche (etat memorise) et devient un tiroir sur mobile.

### Filtres de periode

`usePeriodFilter` + `<PeriodFilter />` : annee scolaire, puis annee entiere, trimestre ou mois. La selection est partagee entre les ecrans ; `params` se passe tel quel a l'API (`academic_year`, `term_id`, `month`).

### Montants

Les montants s'affichent dans la devise `NEXT_PUBLIC_CURRENCY` (code ISO 4217, `GNF` par defaut).

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

Les tests d'integration (connexion, liste des eleves, appel de classe, absences, detail d'un trimestre, encaissement, filtres de periode, themes, navigation) mockent l'API via [MSW](https://mswjs.io) — voir `src/test/msw/`.
# ERP-MAARIF-WEB
