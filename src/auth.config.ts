import type { NextAuthConfig } from "next-auth"
import type { AccountStatus, Role } from "@prisma/client"

import { homeForRole, roleFromPath } from "@/lib/roles"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const user = auth?.user
      const isLoggedIn = Boolean(user)
      const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/pending"

      if (pathname.startsWith("/api/")) {
        return true
      }

      if (isAuthPage) {
        if (isLoggedIn && user?.accountStatus === "APPROVED" && user.role) {
          return Response.redirect(new URL(homeForRole(user.role), request.nextUrl))
        }
        if (isLoggedIn && pathname !== "/pending" && user?.accountStatus === "PENDING") {
          return Response.redirect(new URL("/pending", request.nextUrl))
        }
        return true
      }

      if (!isLoggedIn) {
        return false
      }

      if (user?.accountStatus === "PENDING") {
        return Response.redirect(new URL("/pending", request.nextUrl))
      }

      if (user?.accountStatus !== "APPROVED") {
        return Response.redirect(new URL("/login", request.nextUrl))
      }

      const first = pathname.split("/").filter(Boolean)[0]
      const pathRole = first ? roleFromPath(first) : null
      if (pathRole && user.role && pathRole !== user.role) {
        return Response.redirect(new URL(homeForRole(user.role), request.nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.role = user.role
        token.accountStatus = user.accountStatus
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.username =
          typeof token.username === "string" ? token.username : ""
        if (typeof token.role === "string") {
          session.user.role = token.role as Role
        }
        if (typeof token.accountStatus === "string") {
          session.user.accountStatus = token.accountStatus as AccountStatus
        }
      }
      return session
    },
  },
} satisfies NextAuthConfig
