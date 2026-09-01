"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { isNavActive, navForRole } from "@/components/shell/nav"
import type { ShellUser } from "@/components/shell/user"
import { homeForRole } from "@/lib/roles"
import { ROLE_LABEL } from "@/lib/roles"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const base = homeForRole(user.role)
  const nav = navForRole(user.role, base)

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pt-4">
        <Link
          href={base}
          className="flex items-center gap-2 rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            E
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-bold">Edukmoko</span>
            <span className="block truncate text-[10px] text-sidebar-foreground/60">
              {ROLE_LABEL[user.role]}
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Workspace" items={nav.primary} pathname={pathname} />
        <NavGroup label="Account" items={nav.system} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  )
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: ReturnType<typeof navForRole>["primary"]
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isNavActive(pathname, item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
