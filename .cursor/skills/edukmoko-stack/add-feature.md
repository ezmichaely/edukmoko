# Add an Edukmoko feature

Work top-down: schema → rules → GraphQL → panel → `[role]` page → nav.

## 1. Schema

Edit `prisma/schema.prisma`. Prefer `cuid()` ids, `DateTime` timestamps, enums over string statuses. Relations must encode who owns the row (author, class, student).

Then: `pnpm db:push` (or `pnpm db:migrate`) and extend `prisma/seed.mjs` if the feature needs a demo path.

## 2. Rules

Add or extend `src/lib/rules/<area>.ts`:

- First line of every exported function: `requireUser(session)` or `requireRoles(session, ...)`
- Teaching writes: `TEACHING_ROLES` plus class instructor check
- Throw `AppInputError` (validation), `AppForbiddenError` (RBAC), `AppNotFoundError`, `AppConflictError`
- Map dates to ISO strings before returning to GraphQL
- Write `writeAuditLog(...)` for approvals, joins, catalog, account status

## 3. GraphQL

`src/graphql/server/schema.ts`:

- Extend `type Query` / `type Mutation` and inputs
- Resolver: `withAppErrors(() => rules.fn(ctx.session, args))`
- Do not import Prisma in this file

Client: `graphqlRequest` from `@/graphql/client/request` with inline documents (no Apollo).

## 4. UI

- Client panel in `src/components/features/`
- Use shadcn (`Button`, `Card`, `Table`, `Tabs`) and `PageHeader`
- Toast failures with `sonner`
- Page under `src/app/[role]/...` is a server component that passes `basePath={`/${role}`}` and `session.user.role`
- Add a nav item in `src/components/shell/nav.ts` only for a top-level surface; hide by role there

## 5. Files / PDF

Binary stays on route handlers (`src/app/api/uploads`, `src/app/api/files`, `src/app/api/modules/[id]/pdf`). GraphQL stores the URL string only.

## Checklist

- [ ] PENDING users cannot hit the feature (proxy + layout)
- [ ] Wrong-role URL prefix redirects home
- [ ] Students cannot see other students' answers / `isCorrect`
- [ ] Seed path still works for the five demo accounts
