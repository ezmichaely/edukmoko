---
name: edukmoko-stack
description: >-
  Edukmoko app architecture and coding conventions. Use when changing
  Edukmoko, the LMS rebuild of NORSU ELCMS, or anything involving Prisma,
  GraphQL Yoga, Auth.js, role routes, shadcn, people-base-style layers,
  or Next.js App Router in this repo.
---

# Edukmoko stack

Match **people-base** patterns: PostgreSQL + Prisma + App Router + GraphQL Yoga + Auth.js + shadcn. Do not reintroduce MongoDB, Apollo Client, or Next.js parallel route slots (`@dean`, `@instructor`, …) as role UIs.

## Layers

| Concern | Location |
| --- | --- |
| Schema | `prisma/schema.prisma` |
| Session / RBAC | `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/lib/session.ts`, `src/lib/roles.ts` |
| Business rules | `src/lib/rules/*.ts` (Prisma stays here, not in UI) |
| GraphQL | `src/graphql/server/` (typeDefs + resolvers), client via `src/graphql/client/request.ts` |
| Role pages | `src/app/[role]/...` — one tree, not five copies |
| UI | `src/components/features/*-panel.tsx` + `src/components/shell/` |
| Files / PDF | Route Handlers under `src/app/api/` — not GraphQL |

Auth is cookie session (Auth.js). GraphQL context reads `auth()`. Uploads and module PDF stay REST.

## Add or change a domain feature

1. Prisma model + `pnpm db:push` (or migrate)
2. Rules in `src/lib/rules/` — throw `AppInputError` / `AppForbiddenError` / `AppNotFoundError`
3. GraphQL in `src/graphql/server/schema.ts` — wrap resolvers with `withAppErrors`
4. Client panel calls `graphqlRequest`
5. Thin page under `src/app/[role]/...` that passes `basePath` and `role`
6. Nav in `src/components/shell/nav.ts` if it is a new primary surface

## Do not

- Duplicate pages per role folder (the PHP app did that; this repo does not)
- Put Prisma in Client Components
- Return HTML from GraphQL (JSON only)
- Hash passwords with MD5; use bcrypt via `src/lib/rules/auth.ts`
- Commit `.env` or live credentials
- Use `@dean` / `@students` slots for product routes — leftover `default.tsx` stubs must stay empty

## Roles in URLs

`ADMIN → /admin`, `STUDENT → /student`, `INSTRUCTOR → /instructor`, `DEPT_HEAD → /depthead`, `DEAN → /dean`. `src/proxy.ts` plus `[role]/layout.tsx` reject the wrong prefix and send `PENDING` users to `/pending`.

## Product rules

For statuses, class codes, and who can approve modules, read [domain.md](domain.md). For a full vertical slice, read [add-feature.md](add-feature.md).
