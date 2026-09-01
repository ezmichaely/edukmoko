"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@prisma/client"

type ModuleRow = {
  id: string
  title: string
  status: string
  subject: { code: string; title: string }
  author: { name: string }
}

export function ModulesPanel({
  basePath,
  role,
}: {
  basePath: string
  role: Role
}) {
  const [modules, setModules] = useState<ModuleRow[]>([])
  const canCreate = role === "INSTRUCTOR" || role === "DEPT_HEAD" || role === "ADMIN"

  useEffect(() => {
    void graphqlRequest<{ modules: ModuleRow[] }>(
      `query { modules { id title status subject { code title } author { name } } }`,
    )
      .then((data) => setModules(data.modules))
      .catch((error: Error) => toast.error(error.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning modules"
        description="Draft, submit, and track approval from department head to dean."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={`${basePath}/modules/new`}>New module</Link>
            </Button>
          ) : null
        }
      />
      {modules.map((module) => (
        <Link key={module.id} href={`${basePath}/modules/${module.id}`}>
          <Card className="mb-3 hover:bg-muted/40">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{module.title}</p>
                <p className="text-sm text-muted-foreground">
                  {module.subject.code} · {module.author.name}
                </p>
              </div>
              <Badge variant="outline">{module.status.replaceAll("_", " ")}</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
