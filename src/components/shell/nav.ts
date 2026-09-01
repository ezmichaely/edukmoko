import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  School,
  ScrollText,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Role } from "@prisma/client"

export type AppNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export function navForRole(role: Role, base: string): { primary: AppNavItem[]; system: AppNavItem[] } {
  const primary: AppNavItem[] = [
    { title: "Feed", href: base, icon: Newspaper },
    { title: "Classes", href: `${base}/classes`, icon: School },
    { title: "Messages", href: `${base}/messages`, icon: MessageSquare },
  ]

  if (role === "INSTRUCTOR" || role === "DEPT_HEAD") {
    primary.push({ title: "Modules", href: `${base}/modules`, icon: BookOpen })
  }
  if (role === "DEPT_HEAD" || role === "DEAN" || role === "ADMIN") {
    primary.push({ title: "Approvals", href: `${base}/approvals`, icon: ScrollText })
  }
  if (role === "DEAN" || role === "DEPT_HEAD" || role === "ADMIN") {
    primary.push({ title: "People", href: `${base}/users`, icon: Users })
  }
  if (role === "ADMIN") {
    primary.unshift({ title: "Dashboard", href: `${base}/dashboard`, icon: LayoutDashboard })
    primary.push({ title: "Catalog", href: `${base}/catalog`, icon: GraduationCap })
    primary.push({ title: "Requests", href: `${base}/requests`, icon: Shield })
    primary.push({ title: "Logs", href: `${base}/logs`, icon: ScrollText })
  }

  return {
    primary,
    system: [{ title: "Profile", href: `${base}/profile`, icon: Settings }],
  }
}

export function isNavActive(pathname: string, href: string) {
  if (pathname === href) {
    return true
  }
  if (href.split("/").length <= 2) {
    return false
  }
  return pathname.startsWith(`${href}/`)
}
