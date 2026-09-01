# Edukmoko

Next.js rebuild of NORSU ELCMS: a campus LMS with five roles, a social feed, direct messages, class join codes, learning-module approval, and a working assessment/gradebook.

## Stack

- Next.js App Router
- PostgreSQL + Prisma
- GraphQL Yoga at `/api/graphql`
- Auth.js credentials (bcrypt, pending-approval gate)
- shadcn/ui

The previous MongoDB/parallel-route skeleton lives on the `old-main` branch.

## Setup

```bash
pnpm install
cp .env.example .env
# start Postgres (docker compose up -d if you have Docker)
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seeded logins

Usernames are lowercase. Passwords match the original NORSU demo accounts.

| Role | Username | Password |
| --- | --- | --- |
| Admin | `registeradmin` | `RegisterAdmin` |
| Dean | `registercollegedean` | `RegisterCollegeDean` |
| Department head | `registerdepthead` | `RegisterDeptHead` |
| Instructor | `registerinstructor` | `RegisterInstructor` |
| Student | `studentregister` | `StudentRegister` |

Demo class join code: `CLASS123`

## Roles

- `/student`, `/instructor`, `/depthead`, `/dean`, `/admin`
- New student/instructor registrations stay `PENDING` until an admin approves them
- Modules move `DRAFT → DEPT_HEAD_REVIEW → DEAN_REVIEW → PUBLISHED`
