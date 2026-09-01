import "server-only"

import { prisma } from "@/lib/prisma"
import {
  AppConflictError,
  AppInputError,
  AppNotFoundError,
} from "@/lib/rules/errors"
import { requireRoles, requireUser, type SessionUser } from "@/lib/session"
import { writeAuditLog } from "@/lib/queries/auth"

export async function listCatalog(session: SessionUser | null) {
  requireUser(session)
  const [colleges, departments, courses, majors, subjects, schoolYears, semesters] =
    await Promise.all([
      prisma.college.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({
        orderBy: { name: "asc" },
        include: { college: true },
      }),
      prisma.course.findMany({
        orderBy: { name: "asc" },
        include: { college: true },
      }),
      prisma.major.findMany({
        orderBy: { name: "asc" },
        include: { course: true },
      }),
      prisma.subject.findMany({
        orderBy: { code: "asc" },
        include: { department: true, course: true },
      }),
      prisma.schoolYear.findMany({ orderBy: { label: "desc" } }),
      prisma.semester.findMany({ orderBy: { name: "asc" } }),
    ])
  return { colleges, departments, courses, majors, subjects, schoolYears, semesters }
}

export async function upsertCollege(
  session: SessionUser | null,
  input: { id?: string; name: string; code: string },
) {
  const admin = requireRoles(session, ["ADMIN"])
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()
  if (!name || !code) {
    throw new AppInputError("Name and code are required.")
  }
  try {
    const row = input.id
      ? await prisma.college.update({
          where: { id: input.id },
          data: { name, code },
        })
      : await prisma.college.create({ data: { name, code } })
    await writeAuditLog(
      `${admin.username} saved college ${code}`,
      admin.id,
    )
    return row
  } catch (error) {
    if (isUnique(error)) {
      throw new AppConflictError("College code already exists.")
    }
    throw error
  }
}

export async function upsertDepartment(
  session: SessionUser | null,
  input: { id?: string; name: string; code: string; collegeId: string },
) {
  const admin = requireRoles(session, ["ADMIN"])
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()
  if (!name || !code || !input.collegeId) {
    throw new AppInputError("Name, code, and college are required.")
  }
  try {
    const row = input.id
      ? await prisma.department.update({
          where: { id: input.id },
          data: { name, code, collegeId: input.collegeId },
        })
      : await prisma.department.create({
          data: { name, code, collegeId: input.collegeId },
        })
    await writeAuditLog(`${admin.username} saved department ${code}`, admin.id)
    return prisma.department.findUniqueOrThrow({
      where: { id: row.id },
      include: { college: true },
    })
  } catch (error) {
    if (isUnique(error)) {
      throw new AppConflictError("Department code already exists in this college.")
    }
    throw error
  }
}

export async function upsertCourse(
  session: SessionUser | null,
  input: { id?: string; name: string; code: string; collegeId: string },
) {
  const admin = requireRoles(session, ["ADMIN"])
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()
  if (!name || !code || !input.collegeId) {
    throw new AppInputError("Name, code, and college are required.")
  }
  const row = input.id
    ? await prisma.course.update({
        where: { id: input.id },
        data: { name, code, collegeId: input.collegeId },
      })
    : await prisma.course.create({
        data: { name, code, collegeId: input.collegeId },
      })
  await writeAuditLog(`${admin.username} saved course ${code}`, admin.id)
  return prisma.course.findUniqueOrThrow({
    where: { id: row.id },
    include: { college: true },
  })
}

export async function upsertMajor(
  session: SessionUser | null,
  input: { id?: string; name: string; code: string; courseId: string },
) {
  const admin = requireRoles(session, ["ADMIN"])
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()
  if (!name || !code || !input.courseId) {
    throw new AppInputError("Name, code, and course are required.")
  }
  const row = input.id
    ? await prisma.major.update({
        where: { id: input.id },
        data: { name, code, courseId: input.courseId },
      })
    : await prisma.major.create({
        data: { name, code, courseId: input.courseId },
      })
  await writeAuditLog(`${admin.username} saved major ${code}`, admin.id)
  return prisma.major.findUniqueOrThrow({
    where: { id: row.id },
    include: { course: true },
  })
}

export async function upsertSubject(
  session: SessionUser | null,
  input: {
    id?: string
    code: string
    title: string
    departmentId?: string | null
    courseId?: string | null
  },
) {
  const admin = requireRoles(session, ["ADMIN"])
  const code = input.code.trim().toUpperCase()
  const title = input.title.trim()
  if (!code || !title) {
    throw new AppInputError("Subject code and title are required.")
  }
  try {
    const row = input.id
      ? await prisma.subject.update({
          where: { id: input.id },
          data: {
            code,
            title,
            departmentId: input.departmentId || null,
            courseId: input.courseId || null,
          },
        })
      : await prisma.subject.create({
          data: {
            code,
            title,
            departmentId: input.departmentId || null,
            courseId: input.courseId || null,
          },
        })
    await writeAuditLog(`${admin.username} saved subject ${code}`, admin.id)
    return prisma.subject.findUniqueOrThrow({
      where: { id: row.id },
      include: { department: true, course: true },
    })
  } catch (error) {
    if (isUnique(error)) {
      throw new AppConflictError("Subject code already exists.")
    }
    throw error
  }
}

export async function deleteCatalogRow(
  session: SessionUser | null,
  kind: "college" | "department" | "course" | "major" | "subject",
  id: string,
) {
  const admin = requireRoles(session, ["ADMIN"])
  switch (kind) {
    case "college":
      await prisma.college.delete({ where: { id } })
      break
    case "department":
      await prisma.department.delete({ where: { id } })
      break
    case "course":
      await prisma.course.delete({ where: { id } })
      break
    case "major":
      await prisma.major.delete({ where: { id } })
      break
    case "subject":
      await prisma.subject.delete({ where: { id } })
      break
    default:
      throw new AppNotFoundError("Unknown catalog type.")
  }
  await writeAuditLog(`${admin.username} deleted ${kind} ${id}`, admin.id)
  return true
}

function isUnique(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}
