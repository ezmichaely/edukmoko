import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "@/auth.config"
import { verifyCredentials } from "@/lib/rules/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username =
          typeof credentials?.username === "string" ? credentials.username : ""
        const password =
          typeof credentials?.password === "string" ? credentials.password : ""
        const result = await verifyCredentials(username, password)
        return result.ok ? result.user : null
      },
    }),
  ],
})
