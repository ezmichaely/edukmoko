---
name: edukmoko-feature
description: >-
  Implements a new Edukmoko LMS feature as a vertical slice (Prisma, rules,
  GraphQL Yoga, shadcn panel, [role] route). Use when adding classes, modules,
  assessments, feed, messages, catalog, approvals, gradebook, or any new
  Edukmoko / NORSU ELCMS screen.
---

# Implement an Edukmoko feature

Also load the `edukmoko-stack` skill (domain + layering). Do not copy PHP role folders.

## Slice

1. `prisma/schema.prisma` then `pnpm db:push` / migrate; update `prisma/seed.mjs` if demos need it
2. `src/lib/rules/<area>.ts` — `requireUser` / `requireRoles`, app errors, audit log on sensitive writes
3. `src/graphql/server/schema.ts` — `withAppErrors(() => rules.fn(ctx.session, args))`
4. Client panel in `src/components/features/` using `graphqlRequest` + shadcn + `PageHeader`
5. Server page in `src/app/[role]/...` passing `basePath={`/${role}`}` and `role`
6. `src/components/shell/nav.ts` only for a new top-level item

## Guardrails

- PENDING → `/pending`; wrong role prefix → that user's home
- Students never get `isCorrect` or other students' answers
- Files/PDF via `src/app/api/`, URLs only in GraphQL
- No Prisma in Client Components, no Apollo, no MD5
