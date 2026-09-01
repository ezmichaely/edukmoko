"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/auth"
import { registerAccount, verifyCredentials } from "@/lib/rules/auth"
import { homeForRole } from "@/lib/roles"
import { AppInputError } from "@/lib/rules/errors"
import { AUTH_ERROR, type AuthFormError } from "@/utils/auth-form"

export type LoginActionResult = { error: AuthFormError } | { redirectTo: string } | void

export async function loginWithPassword(input: {
  username: string
  password: string
}): Promise<LoginActionResult> {
  try {
    const verified = await verifyCredentials(input.username, input.password)
    if (!verified.ok) {
      if (verified.code === "disabled_account") {
        return { error: AUTH_ERROR.disabledAccount }
      }
      if (verified.code === "rejected") {
        return { error: AUTH_ERROR.rejected }
      }
      return {
        error:
          verified.code === "incorrect_password"
            ? AUTH_ERROR.incorrectPassword
            : AUTH_ERROR.unknownUsername,
      }
    }

    await signIn("credentials", {
      username: input.username,
      password: input.password,
      redirect: false,
    })

    if (verified.user.accountStatus === "PENDING") {
      return { redirectTo: "/pending" }
    }
    return { redirectTo: homeForRole(verified.user.role) }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: AUTH_ERROR.signInFailed }
    }
    throw error
  }
}

export async function registerWithPassword(input: {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  role: "STUDENT" | "INSTRUCTOR"
}): Promise<LoginActionResult> {
  try {
    await registerAccount(input)
  } catch (error) {
    if (error instanceof AppInputError) {
      return {
        error: {
          field: (error.field as AuthFormError["field"]) ?? "form",
          message: error.message,
        },
      }
    }
    throw error
  }
  return loginWithPassword({ username: input.username, password: input.password })
}
