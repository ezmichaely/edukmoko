import type { Role } from "@prisma/client"

export type ShellUser = {
  id: string
  name: string
  username: string
  role: Role
}
