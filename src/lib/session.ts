import type { AccountStatus, Role } from "@prisma/client"

import {
  AppForbiddenError,
  AppUnauthenticatedError,
} from "@/lib/rules/errors"

export type SessionUser = {
  id: string
  username: string
  role: Role
  accountStatus: AccountStatus
}

export function requireUser(session: SessionUser | null): SessionUser {
  if (!session) {
    throw new AppUnauthenticatedError()
  }
  if (session.accountStatus !== "APPROVED") {
    throw new AppForbiddenError("Your account is not approved yet.")
  }
  return session
}

export function requireRoles(
  session: SessionUser | null,
  roles: Role[],
): SessionUser {
  const user = requireUser(session)
  if (!roles.includes(user.role)) {
    throw new AppForbiddenError()
  }
  return user
}
