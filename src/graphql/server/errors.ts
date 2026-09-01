import { GraphQLError } from "graphql"

import {
  AppConflictError,
  AppForbiddenError,
  AppInputError,
  AppNotFoundError,
  AppUnauthenticatedError,
  isDatabaseUnreachable,
} from "@/lib/rules/errors"

export function mapAppError(error: unknown): never {
  if (error instanceof AppInputError) {
    throw new GraphQLError(error.message, { extensions: { code: "BAD_USER_INPUT" } })
  }
  if (error instanceof AppUnauthenticatedError) {
    throw new GraphQLError(error.message, { extensions: { code: "UNAUTHENTICATED" } })
  }
  if (error instanceof AppForbiddenError) {
    throw new GraphQLError(error.message, { extensions: { code: "FORBIDDEN" } })
  }
  if (error instanceof AppNotFoundError) {
    throw new GraphQLError(error.message, { extensions: { code: "NOT_FOUND" } })
  }
  if (error instanceof AppConflictError) {
    throw new GraphQLError(error.message, { extensions: { code: "CONFLICT" } })
  }
  if (isDatabaseUnreachable(error)) {
    throw new GraphQLError("Needs a connection.", { extensions: { code: "UNAVAILABLE" } })
  }
  throw error
}

export async function withAppErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    return mapAppError(error)
  }
}
