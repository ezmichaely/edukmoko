export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 32
export const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function usernameError(value: string): string | undefined {
  const username = normalizeUsername(value)
  if (!username) {
    return "Username is required."
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–32 characters: letters, numbers, or underscore."
  }
  return undefined
}
