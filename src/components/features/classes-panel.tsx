"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Role } from "@prisma/client"

type Classroom = {
  id: string
  name: string
  joinCode: string
  instructor: { name: string }
  module: { title: string } | null
}

export function ClassesPanel({
  basePath,
  role,
}: {
  basePath: string
  role: Role
}) {
  const router = useRouter()
  const [classes, setClasses] = useState<Classroom[]>([])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const canCreate = role === "INSTRUCTOR" || role === "DEPT_HEAD" || role === "ADMIN"

  async function load() {
    const data = await graphqlRequest<{ myClasses: Classroom[] }>(
      `query { myClasses { id name joinCode instructor { name } module { title } } }`,
    )
    setClasses(data.myClasses)
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [])

  async function create() {
    try {
      const data = await graphqlRequest<{ createClass: Classroom }>(
        `mutation CreateClass($name: String!) { createClass(name: $name) { id joinCode name instructor { name } module { title } } }`,
        { name },
      )
      setName("")
      await load()
      router.push(`${basePath}/classes/${data.createClass.joinCode}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create class")
    }
  }

  async function join() {
    try {
      const data = await graphqlRequest<{ joinClass: Classroom }>(
        `mutation JoinClass($joinCode: String!) { joinClass(joinCode: $joinCode) { joinCode } }`,
        { joinCode: code },
      )
      router.push(`${basePath}/classes/${data.joinClass.joinCode}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" description="Create a room or join with a class code." />
      <div className="grid gap-4 md:grid-cols-2">
        {canCreate ? (
          <Card>
            <CardHeader>
              <CardTitle>Create class</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="ITS 207 Section A" />
              <Button onClick={() => void create()} disabled={!name.trim()}>
                Create
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Join with code</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CLASS123" />
            <Button onClick={() => void join()} disabled={!code.trim()}>
              Join
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3">
        {classes.map((classroom) => (
          <Link key={classroom.id} href={`${basePath}/classes/${classroom.joinCode}`}>
            <Card className="hover:bg-muted/40">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{classroom.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {classroom.instructor.name}
                    {classroom.module ? ` · ${classroom.module.title}` : ""}
                  </p>
                </div>
                <code className="rounded bg-muted px-2 py-1 text-xs">{classroom.joinCode}</code>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
