import "server-only"

import type { ModuleStatus, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { writeAuditLog } from "@/lib/queries/auth"
import { AppForbiddenError, AppInputError, AppNotFoundError } from "@/lib/rules/errors"
import { toGraphqlUser, userPublicSelect } from "@/lib/rules/users"
import { requireRoles, requireUser, type SessionUser } from "@/lib/session"
import { TEACHING_ROLES } from "@/lib/roles"

const moduleInclude = {
  subject: true,
  author: { select: userPublicSelect },
  outlines: { orderBy: { order: "asc" as const } },
} satisfies Prisma.ModuleInclude

function mapModule(
  module: Prisma.ModuleGetPayload<{ include: typeof moduleInclude }>,
) {
  return {
    ...module,
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
    author: toGraphqlUser(module.author),
    outlines: module.outlines.map((outline) => ({
      ...outline,
      createdAt: outline.createdAt.toISOString(),
      updatedAt: outline.updatedAt.toISOString(),
    })),
  }
}

export async function listModules(
  session: SessionUser | null,
  filter?: { mine?: boolean; status?: ModuleStatus },
) {
  const current = requireUser(session)
  const modules = await prisma.module.findMany({
    where: {
      authorId: filter?.mine ? current.id : undefined,
      status: filter?.status,
    },
    include: moduleInclude,
    orderBy: { updatedAt: "desc" },
  })
  return modules.map(mapModule)
}

export async function getModule(session: SessionUser | null, id: string) {
  requireUser(session)
  const module = await prisma.module.findUnique({
    where: { id },
    include: moduleInclude,
  })
  if (!module) {
    throw new AppNotFoundError("Module not found.")
  }
  return mapModule(module)
}

export async function createModule(
  session: SessionUser | null,
  input: {
    title: string
    intro: string
    outcomes: string
    consent?: string | null
    subjectId: string
  },
) {
  const current = requireRoles(session, TEACHING_ROLES)
  const title = input.title.trim()
  if (!title || !input.subjectId) {
    throw new AppInputError("Title and subject are required.")
  }
  const module = await prisma.module.create({
    data: {
      title,
      intro: input.intro.trim(),
      outcomes: input.outcomes.trim(),
      consent: input.consent?.trim() || null,
      subjectId: input.subjectId,
      authorId: current.id,
      status: "DRAFT",
    },
    include: moduleInclude,
  })
  await writeAuditLog(`${current.username} created module ${title}`, current.id)
  return mapModule(module)
}

export async function updateModule(
  session: SessionUser | null,
  input: {
    id: string
    title?: string
    intro?: string
    outcomes?: string
    consent?: string | null
  },
) {
  const current = requireUser(session)
  const existing = await prisma.module.findUnique({ where: { id: input.id } })
  if (!existing) {
    throw new AppNotFoundError("Module not found.")
  }
  if (existing.authorId !== current.id && current.role !== "ADMIN") {
    throw new AppForbiddenError()
  }
  const module = await prisma.module.update({
    where: { id: input.id },
    data: {
      title: input.title?.trim(),
      intro: input.intro,
      outcomes: input.outcomes,
      consent: input.consent,
    },
    include: moduleInclude,
  })
  return mapModule(module)
}

export async function saveOutline(
  session: SessionUser | null,
  input: { id?: string; moduleId: string; title: string; content: string; order?: number },
) {
  const current = requireUser(session)
  const module = await prisma.module.findUnique({ where: { id: input.moduleId } })
  if (!module) {
    throw new AppNotFoundError("Module not found.")
  }
  if (module.authorId !== current.id && current.role !== "ADMIN") {
    throw new AppForbiddenError()
  }
  if (input.id) {
    await prisma.outline.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        content: input.content,
        order: input.order ?? 0,
      },
    })
  } else {
    const count = await prisma.outline.count({ where: { moduleId: input.moduleId } })
    await prisma.outline.create({
      data: {
        moduleId: input.moduleId,
        title: input.title.trim(),
        content: input.content,
        order: input.order ?? count,
        authorId: current.id,
      },
    })
  }
  return getModule(session, input.moduleId)
}

export async function deleteOutline(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const outline = await prisma.outline.findUnique({
    where: { id },
    include: { module: true },
  })
  if (!outline) {
    throw new AppNotFoundError("Outline not found.")
  }
  if (outline.module.authorId !== current.id && current.role !== "ADMIN") {
    throw new AppForbiddenError()
  }
  await prisma.outline.delete({ where: { id } })
  return getModule(session, outline.moduleId)
}

export async function submitModuleForReview(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const existing = await prisma.module.findUnique({ where: { id } })
  if (!existing) {
    throw new AppNotFoundError("Module not found.")
  }
  if (existing.authorId !== current.id) {
    throw new AppForbiddenError()
  }
  if (existing.status !== "DRAFT" && existing.status !== "DEPT_HEAD_REVISION") {
    throw new AppInputError("This module cannot be submitted right now.")
  }
  const module = await prisma.module.update({
    where: { id },
    data: { status: "DEPT_HEAD_REVIEW", revisionNote: null },
    include: moduleInclude,
  })
  await writeAuditLog(`${current.username} submitted module for review`, current.id)
  return mapModule(module)
}

export async function reviewModule(
  session: SessionUser | null,
  input: { id: string; action: "APPROVE" | "REVISE"; note?: string | null },
) {
  const current = requireUser(session)
  const existing = await prisma.module.findUnique({ where: { id: input.id } })
  if (!existing) {
    throw new AppNotFoundError("Module not found.")
  }

  let next: ModuleStatus
  if (existing.status === "DEPT_HEAD_REVIEW") {
    requireRoles(session, ["DEPT_HEAD", "ADMIN"])
    next = input.action === "APPROVE" ? "DEAN_REVIEW" : "DEPT_HEAD_REVISION"
  } else if (existing.status === "DEAN_REVIEW") {
    requireRoles(session, ["DEAN", "ADMIN"])
    next = input.action === "APPROVE" ? "PUBLISHED" : "DEAN_REVISION"
  } else if (existing.status === "DEAN_REVISION" && input.action === "APPROVE") {
    requireRoles(session, ["DEAN", "ADMIN"])
    next = "PUBLISHED"
  } else {
    throw new AppInputError("This module is not awaiting your review.")
  }

  const module = await prisma.module.update({
    where: { id: input.id },
    data: {
      status: next,
      revisionNote: input.action === "REVISE" ? input.note?.trim() || "Please revise." : null,
    },
    include: moduleInclude,
  })
  await writeAuditLog(
    `${current.username} ${input.action.toLowerCase()}d module ${existing.title}`,
    current.id,
  )
  return mapModule(module)
}

export async function resubmitFromDeanRevision(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const existing = await prisma.module.findUnique({ where: { id } })
  if (!existing || existing.authorId !== current.id) {
    throw new AppForbiddenError()
  }
  if (existing.status !== "DEAN_REVISION") {
    throw new AppInputError("Module is not in dean revision.")
  }
  const module = await prisma.module.update({
    where: { id },
    data: { status: "DEAN_REVIEW", revisionNote: null },
    include: moduleInclude,
  })
  return mapModule(module)
}
