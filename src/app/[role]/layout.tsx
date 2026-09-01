import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { DashboardShell } from "@/components/shell/dashboard-shell"
import { displayName } from "@/lib/names"
import { getLoginState } from "@/lib/rules/auth"
import { homeForRole, roleFromPath } from "@/lib/roles"

export default async function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ role: string }>
}) {
  const { role: rolePath } = await params
  const role = roleFromPath(rolePath)
  if (!role) {
    notFound()
  }

  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  const login = await getLoginState(session.user.id)
  if (!login || login.disabledAt) {
    redirect("/login")
  }
  if (login.accountStatus === "PENDING") {
    redirect("/pending")
  }
  if (login.role !== role) {
    redirect(homeForRole(login.role))
  }

  return (
    <DashboardShell
      user={{
        id: login.id,
        name: displayName(login),
        username: login.username,
        role: login.role,
      }}
    >
      {children}
    </DashboardShell>
  )
}
