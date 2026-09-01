import { DefaultSession } from "next-auth"
import type { AccountStatus, Role } from "@prisma/client"

declare module "next-auth" {
  interface User {
    username: string
    role: Role
    accountStatus: AccountStatus
  }

  interface Session {
    user: {
      id: string
      username: string
      role: Role
      accountStatus: AccountStatus
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    role?: Role
    accountStatus?: AccountStatus
  }
}
