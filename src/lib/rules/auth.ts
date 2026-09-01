import "server-only"

import type { Role } from "@prisma/client"
import { compare, hash } from "bcryptjs"

import {
  AppInputError,
  DatabaseUnreachableError,
  isDatabaseUnreachable,
} from "@/lib/rules/errors"
import { MIN_PASSWORD_LENGTH, PASSWORD_ROUNDS } from "@/lib/rules/password"
import {
  createRegisteredUser,
  findUserCredentialsByUsername,
  findUserLoginById,
  writeAuditLog,
} from "@/lib/queries/auth"
import { displayName } from "@/lib/names"
import { AUTH_ERROR } from "@/utils/auth-form"
import { normalizeUsername, usernameError } from "@/utils/username"

const INVALID_PASSWORD_HASH =
  "$2b$10$l93iOqQCmfxYZjuS1qDTZutvDg0wsnC22H78wgY2ec.5zcGt46Y1e"

export type AuthenticatedUser = {
  id: string
  username: string
  name: string
  email: string
  role: Role
  accountStatus: "PENDING" | "APPROVED" | "REJECTED"
}

async function withDatabase<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (isDatabaseUnreachable(error)) {
      throw new DatabaseUnreachableError()
    }
    throw error
  }
}

export type VerifyResult =
  | { ok: true; user: AuthenticatedUser }
  | {
      ok: false
      code:
        | "unknown_username"
        | "incorrect_password"
        | "disabled_account"
        | "rejected"
    }

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<VerifyResult> {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) {
    return { ok: false, code: "unknown_username" }
  }
  if (!password) {
    return { ok: false, code: "incorrect_password" }
  }

  const user = await withDatabase(() =>
    findUserCredentialsByUsername(normalizedUsername),
  )
  const passwordHash = user?.passwordHash ?? INVALID_PASSWORD_HASH
  const passwordMatches = await compare(password, passwordHash)

  if (!user) {
    return { ok: false, code: "unknown_username" }
  }
  if (!passwordMatches) {
    return { ok: false, code: "incorrect_password" }
  }
  if (user.disabledAt) {
    return { ok: false, code: "disabled_account" }
  }
  if (user.accountStatus === "REJECTED") {
    return { ok: false, code: "rejected" }
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      name: displayName(user),
    },
  }
}

export async function getLoginState(userId: string) {
  return withDatabase(() => findUserLoginById(userId))
}

export async function registerAccount(input: {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  role: "STUDENT" | "INSTRUCTOR"
}) {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()
  const username = normalizeUsername(input.username)
  const usernameMessage = usernameError(username)
  if (!firstName) {
    throw new AppInputError("First name is required.", "firstName")
  }
  if (!lastName) {
    throw new AppInputError("Last name is required.", "lastName")
  }
  if (!email || !email.includes("@")) {
    throw new AppInputError("A valid email is required.", "email")
  }
  if (usernameMessage) {
    throw new AppInputError(usernameMessage, "username")
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AppInputError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      "password",
    )
  }

  const passwordHash = await hash(input.password, PASSWORD_ROUNDS)

  try {
    const user = await withDatabase(() =>
      createRegisteredUser({
        username,
        email,
        passwordHash,
        role: input.role,
        firstName,
        lastName,
        accountStatus: "PENDING",
      }),
    )
    await writeAuditLog(`${username} registered as ${input.role}`, user.id)
    return user
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target =
        "meta" in error &&
        typeof error.meta === "object" &&
        error.meta &&
        "target" in error.meta
          ? String(error.meta.target)
          : ""
      if (target.includes("email")) {
        throw new AppInputError(AUTH_ERROR.emailTaken.message, "email")
      }
      throw new AppInputError(AUTH_ERROR.usernameTaken.message, "username")
    }
    throw error
  }
}
