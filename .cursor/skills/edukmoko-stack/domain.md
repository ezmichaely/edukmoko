# Edukmoko domain

Source product: NORSU ELCMS (vanilla PHP). This repo is a **rebuild**, not a pixel port. Keep the academic IA; do not invent a generic Coursera clone.

## Roles

| Role | Path | Teaching | Module review |
| --- | --- | --- | --- |
| Student | `/student` | Join classes, take assessments | Read published lessons |
| Instructor | `/instructor` | Create class + module + assessments | Submit for review |
| Department head | `/depthead` | Same as instructor | First approval / revision |
| College dean | `/dean` | No class teaching UI required | Final approval → Published |
| Admin | `/admin` | Catalog, account requests, logs | Can override reviews |

New student/instructor signups are `PENDING` until admin `APPROVED` / `REJECTED`. Seeded demo users are already approved.

## Module workflow

Exact status enum — do not use free-form PHP strings:

`DRAFT → DEPT_HEAD_REVIEW → DEPT_HEAD_REVISION → DEAN_REVIEW → DEAN_REVISION → PUBLISHED`

- Author submits from `DRAFT` or `DEPT_HEAD_REVISION` → `DEPT_HEAD_REVIEW`
- Dept head approve → `DEAN_REVIEW`; revise → `DEPT_HEAD_REVISION`
- Dean approve → `PUBLISHED`; revise → `DEAN_REVISION`
- Author resubmits dean revision → `DEAN_REVIEW`
- Only **published** modules attach to a class

Rules live in `src/lib/rules/modules.ts`.

## Classes

Edmodo-style join codes (`Class.joinCode`). Instructor creates; students join. Class home shows attached module outlines as the lesson. Gradebook is `classRecord` on the class.

## Social + chat

Campus wall (`Post` / `Comment`) and 1:1 `Conversation` + `Message`. Polling is enough; no websockets in v1.

## Assessments (greenfield)

PHP had quiz/assignment/exam **pages with no tables**. This schema is the source of truth:

- Types: `QUIZ | ASSIGNMENT | PROJECT | MAJOR_EXAM`
- Questions: `MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY | FILE_UPLOAD`
- Auto-score MCQ / true-false on submit; manual `gradeAttempt` for text/file
- `GradeEntry` unique on `(classId, studentId, assessmentId)`
- Never return real `isCorrect` to students in GraphQL

## Catalog

`College → Department → Course → Major`, plus `Subject`, `SchoolYear`, `Semester`. Admin CRUD via `src/lib/rules/catalog.ts`.

## Auth upgrades vs PHP

bcrypt, Auth.js cookies, no InfinityFree credentials, no MD5. Usernames normalize to lowercase (`src/utils/username.ts`). Seed passwords keep the old demo strings (see README).

## Non-goals unless asked

Pixel-perfect Bootstrap, email, payments, video CDN, realtime chat, importing the MySQL dump / MD5 users / `upload/` files.
