"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/shell/header"
import { AppSidebar } from "@/components/shell/sidebar"
import type { ShellUser } from "@/components/shell/user"

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: ShellUser
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader user={user} />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
