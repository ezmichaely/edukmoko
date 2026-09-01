import type { Role } from "@prisma/client"

export const ROLE_PATH = {
  ADMIN: "admin",
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  DEPT_HEAD: "depthead",
  DEAN: "dean",
} as const satisfies Record<Role, string>

export const PATH_ROLE = {
  admin: "ADMIN",
  student: "STUDENT",
  instructor: "INSTRUCTOR",
  depthead: "DEPT_HEAD",
  dean: "DEAN",
} as const satisfies Record<string, Role>

export type RolePath = (typeof ROLE_PATH)[Role]

export function pathForRole(role: Role): RolePath {
  return ROLE_PATH[role]
}

export function roleFromPath(segment: string): Role | null {
  if (segment in PATH_ROLE) {
    return PATH_ROLE[segment as keyof typeof PATH_ROLE]
  }
  return null
}

export function homeForRole(role: Role): string {
  return `/${pathForRole(role)}`
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  DEPT_HEAD: "Department Head",
  DEAN: "College Dean",
}

export const TEACHING_ROLES: Role[] = ["INSTRUCTOR", "DEPT_HEAD"]
export const APPROVER_ROLES: Role[] = ["DEPT_HEAD", "DEAN", "ADMIN"]
export const STAFF_ROLES: Role[] = ["INSTRUCTOR", "DEPT_HEAD", "DEAN", "ADMIN"]
