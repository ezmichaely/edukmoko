import "server-only"

import type { Prisma, Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { displayName } from "@/lib/names"
import {
  AppForbiddenError,
  AppInputError,
  AppNotFoundError,
} from "@/lib/rules/errors"
import { requireRoles, requireUser, type SessionUser } from "@/lib/session"
import { writeAuditLog } from "@/lib/queries/auth"

export const userPublicSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  accountStatus: true,
  firstName: true,
  middleName: true,
  lastName: true,
  suffix: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  phone: true,
  bio: true,
  avatarUrl: true,
  coverUrl: true,
  collegeId: true,
  departmentId: true,
  courseId: true,
  majorId: true,
  createdAt: true,
  college: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  course: { select: { id: true, name: true, code: true } },
  major: { select: { id: true, name: true, code: true } },
} satisfies Prisma.UserSelect

export type UserRecord = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>

export function toGraphqlUser(user: UserRecord) {
  return {
    ...user,
    name: displayName(user),
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function getMe(session: SessionUser | null) {
  const current = requireUser(session)
  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: userPublicSelect,
  })
  if (!user) {
    throw new AppNotFoundError("User not found.")
  }
  return toGraphqlUser(user)
}

export async function getUserByUsername(
  session: SessionUser | null,
  username: string,
) {
  requireUser(session)
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: userPublicSelect,
  })
  if (!user) {
    throw new AppNotFoundError("User not found.")
  }
  return toGraphqlUser(user)
}

export async function listUsers(
  session: SessionUser | null,
  filter?: { role?: Role; accountStatus?: UserRecord["accountStatus"] },
) {
  requireRoles(session, ["ADMIN", "DEAN", "DEPT_HEAD"])
  const users = await prisma.user.findMany({
    where: {
      role: filter?.role,
      accountStatus: filter?.accountStatus,
    },
    select: userPublicSelect,
    orderBy: { createdAt: "desc" },
  })
  return users.map(toGraphqlUser)
}

export async function updateMyProfile(
  session: SessionUser | null,
  input: {
    firstName?: string
    lastName?: string
    bio?: string | null
    phone?: string | null
    address?: string | null
    avatarUrl?: string | null
    coverUrl?: string | null
  },
) {
  const current = requireUser(session)
  const user = await prisma.user.update({
    where: { id: current.id },
    data: {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      bio: input.bio,
      phone: input.phone,
      address: input.address,
      avatarUrl: input.avatarUrl,
      coverUrl: input.coverUrl,
    },
    select: userPublicSelect,
  })
  return toGraphqlUser(user)
}

export async function setAccountStatus(
  session: SessionUser | null,
  userId: string,
  accountStatus: UserRecord["accountStatus"],
) {
  const admin = requireRoles(session, ["ADMIN"])
  if (accountStatus !== "APPROVED" && accountStatus !== "REJECTED" && accountStatus !== "PENDING") {
    throw new AppInputError("Invalid account status.")
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus },
    select: userPublicSelect,
  })
  await writeAuditLog(
    `${admin.username} set ${user.username} to ${accountStatus}`,
    admin.id,
  )
  return toGraphqlUser(user)
}

export async function listAuditLogs(session: SessionUser | null) {
  requireRoles(session, ["ADMIN"])
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: userPublicSelect },
    },
  })
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    user: log.user ? toGraphqlUser(log.user) : null,
  }))
}

export function assertSameUserOrAdmin(session: SessionUser, userId: string) {
  if (session.id !== userId && session.role !== "ADMIN") {
    throw new AppForbiddenError()
  }
}
