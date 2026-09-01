import "server-only"

import { randomBytes } from "node:crypto"

import { prisma } from "@/lib/prisma"
import { writeAuditLog } from "@/lib/queries/auth"
import { AppConflictError, AppInputError, AppNotFoundError } from "@/lib/rules/errors"
import { toGraphqlUser, userPublicSelect } from "@/lib/rules/users"
import { requireRoles, requireUser, type SessionUser } from "@/lib/session"
import { TEACHING_ROLES } from "@/lib/roles"

function joinCode() {
  return randomBytes(5).toString("base64url").slice(0, 8)
}

const classInclude = {
  instructor: { select: userPublicSelect },
  module: { include: { subject: true, outlines: { orderBy: { order: "asc" as const } } } },
  schoolYear: true,
  semester: true,
  members: {
    include: {
      user: { select: userPublicSelect },
    },
  },
}

function mapClass(row: Awaited<ReturnType<typeof prisma.class.findFirstOrThrow>> & {
  instructor: Parameters<typeof toGraphqlUser>[0]
  members: { id: string; role: string; user: Parameters<typeof toGraphqlUser>[0] }[]
  module: { id: string; title: string; status: string; subject: { code: string; title: string }; outlines: { id: string; title: string; content: string; order: number }[] } | null
  schoolYear: { id: string; label: string } | null
  semester: { id: string; name: string } | null
}) {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.joinCode,
    createdAt: row.createdAt.toISOString(),
    instructor: toGraphqlUser(row.instructor),
    schoolYear: row.schoolYear,
    semester: row.semester,
    module: row.module
      ? {
          id: row.module.id,
          title: row.module.title,
          status: row.module.status,
          subject: row.module.subject,
          outlines: row.module.outlines,
        }
      : null,
    members: row.members.map((member) => ({
      id: member.id,
      role: member.role,
      user: toGraphqlUser(member.user),
    })),
  }
}

async function loadClass(id: string) {
  const row = await prisma.class.findUnique({
    where: { id },
    include: classInclude,
  })
  if (!row) {
    throw new AppNotFoundError("Class not found.")
  }
  return mapClass(row)
}

export async function listMyClasses(session: SessionUser | null) {
  const current = requireUser(session)
  const rows = await prisma.class.findMany({
    where: {
      OR: [
        { instructorId: current.id },
        { members: { some: { userId: current.id } } },
      ],
    },
    include: classInclude,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapClass)
}

export async function getClassByCode(session: SessionUser | null, joinCode: string) {
  requireUser(session)
  const row = await prisma.class.findUnique({
    where: { joinCode },
    include: classInclude,
  })
  if (!row) {
    throw new AppNotFoundError("Class not found.")
  }
  return mapClass(row)
}

export async function createClass(
  session: SessionUser | null,
  input: {
    name: string
    moduleId?: string | null
    schoolYearId?: string | null
    semesterId?: string | null
  },
) {
  const current = requireRoles(session, TEACHING_ROLES)
  const name = input.name.trim()
  if (!name) {
    throw new AppInputError("Class name is required.")
  }
  if (input.moduleId) {
    const module = await prisma.module.findUnique({ where: { id: input.moduleId } })
    if (!module || module.status !== "PUBLISHED") {
      throw new AppInputError("Only published modules can be attached to a class.")
    }
  }

  let code = joinCode()
  for (let i = 0; i < 5; i += 1) {
    const clash = await prisma.class.findUnique({ where: { joinCode: code } })
    if (!clash) {
      break
    }
    code = joinCode()
  }

  const row = await prisma.class.create({
    data: {
      name,
      joinCode: code,
      instructorId: current.id,
      moduleId: input.moduleId || null,
      schoolYearId: input.schoolYearId || null,
      semesterId: input.semesterId || null,
      members: {
        create: { userId: current.id, role: "INSTRUCTOR" },
      },
    },
    include: classInclude,
  })
  await writeAuditLog(`${current.username} created class ${name} (${code})`, current.id)
  return mapClass(row)
}

export async function joinClass(session: SessionUser | null, joinCodeValue: string) {
  const current = requireUser(session)
  const existing = await prisma.class.findUnique({
    where: { joinCode: joinCodeValue.trim() },
  })
  if (!existing) {
    throw new AppNotFoundError("Invalid class code.")
  }
  try {
    await prisma.classMember.create({
      data: { classId: existing.id, userId: current.id, role: "STUDENT" },
    })
  } catch {
    throw new AppConflictError("You are already in this class.")
  }
  await writeAuditLog(`${current.username} joined class ${existing.name}`, current.id)
  return loadClass(existing.id)
}

export async function attachModuleToClass(
  session: SessionUser | null,
  classId: string,
  moduleId: string,
) {
  const current = requireUser(session)
  const row = await prisma.class.findUnique({ where: { id: classId } })
  if (!row) {
    throw new AppNotFoundError("Class not found.")
  }
  if (row.instructorId !== current.id && current.role !== "ADMIN") {
    throw new AppInputError("Only the class instructor can attach a module.")
  }
  const module = await prisma.module.findUnique({ where: { id: moduleId } })
  if (!module || module.status !== "PUBLISHED") {
    throw new AppInputError("Only published modules can be attached.")
  }
  await prisma.class.update({
    where: { id: classId },
    data: { moduleId },
  })
  return loadClass(classId)
}
