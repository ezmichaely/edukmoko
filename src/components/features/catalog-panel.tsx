"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Catalog = {
  colleges: { id: string; name: string; code: string }[]
  departments: { id: string; name: string; code: string; college: { id: string; name: string } }[]
  courses: { id: string; name: string; code: string; college: { id: string } }[]
  subjects: { id: string; code: string; title: string }[]
}

export function CatalogPanel() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")

  async function load() {
    const data = await graphqlRequest<{ catalog: Catalog }>(
      `query {
        catalog {
          colleges { id name code }
          departments { id name code college { id name } }
          courses { id name code college { id } }
          subjects { id code title }
        }
      }`,
    )
    setCatalog(data.catalog)
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [])

  async function addCollege() {
    try {
      await graphqlRequest(
        `mutation($input: CatalogInput!) { upsertCollege(input: $input) { id } }`,
        { input: { name, code } },
      )
      setName("")
      setCode("")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    }
  }

  if (!catalog) {
    return <p className="text-sm text-muted-foreground">Loading catalog…</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Academic catalog" description="Colleges, departments, courses, and subjects." />
      <Card>
        <CardHeader>
          <CardTitle>Add college</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CODE" />
          <Button onClick={() => void addCollege()}>Save</Button>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>College</TableHead>
            <TableHead>Code</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalog.colleges.map((college) => (
            <TableRow key={college.id}>
              <TableCell>{college.name}</TableCell>
              <TableCell>{college.code}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Title</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalog.subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell>{subject.code}</TableCell>
              <TableCell>{subject.title}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
