"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { endSessionNow } from "@/components/shell/sign-out"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import type { ShellUser } from "@/components/shell/user"
import { initials } from "@/lib/names"
import { homeForRole, ROLE_LABEL } from "@/lib/roles"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader({ user }: { user: ShellUser }) {
  const pathname = usePathname()
  const title = pathname.split("/").filter(Boolean).at(-1) ?? "Edukmoko"

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="hidden h-5 sm:block" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">{title}</p>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left lg:block">
            <span className="block text-sm font-medium leading-none">{user.name}</span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.username}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`${homeForRole(user.role)}/profile`}>Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void endSessionNow()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
