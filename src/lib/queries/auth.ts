import "server-only"

import type { AccountStatus, Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export async function findUserCredentialsByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      role: true,
      accountStatus: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      disabledAt: true,
    },
  })
}

export async function findUserLoginById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      accountStatus: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      disabledAt: true,
      avatarUrl: true,
    },
  })
}

export async function createRegisteredUser(input: {
  username: string
  email: string
  passwordHash: string
  role: Role
  firstName: string
  middleName?: string | null
  lastName: string
  suffix?: string | null
  accountStatus: AccountStatus
}) {
  return prisma.user.create({
    data: input,
  })
}

export async function writeAuditLog(action: string, userId?: string | null) {
  await prisma.auditLog.create({
    data: { action, userId: userId ?? null },
  })
}
