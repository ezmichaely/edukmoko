export class AppInputError extends Error {
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = "AppInputError"
    this.field = field
  }
}

export class AppUnauthenticatedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message)
    this.name = "AppUnauthenticatedError"
  }
}

export class AppForbiddenError extends Error {
  constructor(message = "You are not allowed to do that.") {
    super(message)
    this.name = "AppForbiddenError"
  }
}

export class AppNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppNotFoundError"
  }
}

export class AppConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppConflictError"
  }
}

export class DatabaseUnreachableError extends Error {
  constructor(message = "The database could not be reached.") {
    super(message)
    this.name = "DatabaseUnreachableError"
  }
}

export function isDatabaseUnreachable(error: unknown): boolean {
  if (error instanceof DatabaseUnreachableError) {
    return true
  }
  if (typeof error !== "object" || error === null) {
    return false
  }
  const code = "code" in error && typeof error.code === "string" ? error.code : ""
  if (["P1001", "P1002", "P1008", "P1017"].includes(code)) {
    return true
  }
  const name = "name" in error && typeof error.name === "string" ? error.name : ""
  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientRustPanicError"
  ) {
    return true
  }
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return (
    message.includes("can't reach database") ||
    message.includes("cannot reach database") ||
    message.includes("timed out fetching") ||
    /econnrefused|enotfound|etimedout|fetch failed/.test(message)
  )
}
