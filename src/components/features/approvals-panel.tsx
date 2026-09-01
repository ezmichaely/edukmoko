"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@prisma/client"
import Link from "next/link"

type ModuleRow = {
  id: string
  title: string
  status: string
  subject: { code: string }
  author: { name: string }
}

export function ApprovalsPanel({ basePath, role }: { basePath: string; role: Role }) {
  const [modules, setModules] = useState<ModuleRow[]>([])
  const status = role === "DEAN" ? "DEAN_REVIEW" : "DEPT_HEAD_REVIEW"

  useEffect(() => {
    void graphqlRequest<{ modules: ModuleRow[] }>(
      `query Modules($status: ModuleStatus) {
        modules(status: $status) { id title status subject { code } author { name } }
      }`,
      { status: role === "ADMIN" ? undefined : status },
    )
      .then((data) => setModules(data.modules))
      .catch((error: Error) => toast.error(error.message))
  }, [role, status])

  return (
    <div className="space-y-6">
      <PageHeader title="Module approvals" description="Review submissions in the department head and dean queues." />
      {modules
        .filter((module) =>
          role === "ADMIN"
            ? module.status.includes("REVIEW")
            : module.status === status,
        )
        .map((module) => (
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
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
      ) : null}
      <Button asChild variant="outline">
        <Link href={`${basePath}/modules`}>All modules</Link>
      </Button>
    </div>
  )
}
