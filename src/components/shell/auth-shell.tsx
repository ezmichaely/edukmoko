import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { ThemeToggle } from "@/components/shell/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-[42%] flex-col justify-between bg-primary px-10 py-16 text-primary-foreground lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="size-10" />
            <div>
              <p className="text-xl font-bold">Edukmoko</p>
              <p className="text-xs uppercase tracking-widest">Learning workspace</p>
            </div>
          </div>
          <h2 className="max-w-md text-3xl font-bold tracking-tight">
            Classes, modules, and a gradebook in one Next.js LMS.
          </h2>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Five roles, module approval, class join codes, and assessments — rebuilt from NORSU ELCMS.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Authorized campus accounts only.</p>
      </aside>
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Card>
            <CardContent className="pt-6">{children}</CardContent>
          </Card>
          {footer ? (
            <div className="text-center text-sm text-muted-foreground">{footer}</div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
