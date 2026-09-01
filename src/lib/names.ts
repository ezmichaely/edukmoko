import type { Role } from "@prisma/client"

export function displayName(parts: {
  firstName: string
  middleName?: string | null
  lastName: string
  suffix?: string | null
}): string {
  return [parts.firstName, parts.middleName, parts.lastName, parts.suffix]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0]?.[0] ?? ""
  const last = parts[parts.length - 1]?.[0] ?? ""
  return `${first}${last}`.toUpperCase()
}

export function roleHomeLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "DEPT_HEAD":
      return "Dept Head"
    case "DEAN":
      return "Dean"
    case "INSTRUCTOR":
      return "Instructor"
    default:
      return "Student"
  }
}
