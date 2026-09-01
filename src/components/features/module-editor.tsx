"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Role } from "@prisma/client"

type Subject = { id: string; code: string; title: string }
type Outline = { id: string; title: string; content: string }
type ModuleDetail = {
  id: string
  title: string
  intro: string
  outcomes: string
  status: string
  revisionNote: string | null
  subject: Subject
  outlines: Outline[]
  author: { username: string }
}

export function ModuleEditor({
  basePath,
  moduleId,
  role,
  username,
}: {
  basePath: string
  moduleId?: string
  role: Role
  username: string
}) {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [title, setTitle] = useState("")
  const [intro, setIntro] = useState("")
  const [outcomes, setOutcomes] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [module, setModule] = useState<ModuleDetail | null>(null)
  const [outlineTitle, setOutlineTitle] = useState("")
  const [outlineContent, setOutlineContent] = useState("")

  async function loadCatalog() {
    const data = await graphqlRequest<{ catalog: { subjects: Subject[] } }>(
      `query { catalog { subjects { id code title } } }`,
    )
    setSubjects(data.catalog.subjects)
    if (!subjectId && data.catalog.subjects[0]) {
      setSubjectId(data.catalog.subjects[0].id)
    }
  }

  async function loadModule(id: string) {
    const data = await graphqlRequest<{ module: ModuleDetail }>(
      `query Module($id: ID!) {
        module(id: $id) {
          id title intro outcomes status revisionNote
          subject { id code title }
          outlines { id title content }
          author { username }
        }
      }`,
      { id },
    )
    setModule(data.module)
    setTitle(data.module.title)
    setIntro(data.module.intro)
    setOutcomes(data.module.outcomes)
  }

  useEffect(() => {
    void loadCatalog().catch((error: Error) => toast.error(error.message))
    if (moduleId) {
      void loadModule(moduleId).catch((error: Error) => toast.error(error.message))
    }
  }, [moduleId])

  async function saveNew() {
    try {
      const data = await graphqlRequest<{ createModule: { id: string } }>(
        `mutation Create($title: String!, $intro: String!, $outcomes: String!, $subjectId: ID!) {
          createModule(title: $title, intro: $intro, outcomes: $outcomes, subjectId: $subjectId) { id }
        }`,
        { title, intro, outcomes, subjectId },
      )
      router.push(`${basePath}/modules/${data.createModule.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create")
    }
  }

  async function saveExisting() {
    if (!module) {
      return
    }
    try {
      await graphqlRequest(
        `mutation Update($id: ID!, $title: String, $intro: String, $outcomes: String) {
          updateModule(id: $id, title: $title, intro: $intro, outcomes: $outcomes) { id }
        }`,
        { id: module.id, title, intro, outcomes },
      )
      toast.success("Saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    }
  }

  async function addOutline() {
    if (!module) {
      return
    }
    try {
      const data = await graphqlRequest<{ saveOutline: ModuleDetail }>(
        `mutation SaveOutline($input: OutlineInput!) {
          saveOutline(input: $input) {
            id title intro outcomes status revisionNote
            subject { id code title }
            outlines { id title content }
            author { username }
          }
        }`,
        { input: { moduleId: module.id, title: outlineTitle, content: outlineContent } },
      )
      setModule(data.saveOutline)
      setOutlineTitle("")
      setOutlineContent("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add outline")
    }
  }

  async function act(mutation: string) {
    if (!module) {
      return
    }
    try {
      const data = await graphqlRequest<{ result: ModuleDetail }>(
        `mutation($id: ID!) { result: ${mutation}(id: $id) {
          id title intro outcomes status revisionNote
          subject { id code title }
          outlines { id title content }
          author { username }
        } }`,
        { id: module.id },
      )
      setModule(data.result)
      toast.success("Updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    }
  }

  async function review(action: "APPROVE" | "REVISE") {
    if (!module) {
      return
    }
    const note = action === "REVISE" ? window.prompt("Revision note") : null
    try {
      const data = await graphqlRequest<{ reviewModule: ModuleDetail }>(
        `mutation Review($id: ID!, $action: ReviewAction!, $note: String) {
          reviewModule(id: $id, action: $action, note: $note) {
            id title intro outcomes status revisionNote
            subject { id code title }
            outlines { id title content }
            author { username }
          }
        }`,
        { id: module.id, action, note },
      )
      setModule(data.reviewModule)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed")
    }
  }

  const isAuthor = module?.author.username === username

  return (
    <div className="space-y-6">
      <PageHeader title={module ? module.title : "New module"} />
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          {!moduleId ? (
            <select
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} — {subject.title}
                </option>
              ))}
            </select>
          ) : null}
          <Textarea value={intro} onChange={(event) => setIntro(event.target.value)} placeholder="Introduction" />
          <Textarea value={outcomes} onChange={(event) => setOutcomes(event.target.value)} placeholder="Outcomes" />
          {moduleId ? (
            <Button onClick={() => void saveExisting()}>Save</Button>
          ) : (
            <Button onClick={() => void saveNew()}>Create</Button>
          )}
        </CardContent>
      </Card>

      {module ? (
        <>
          <p className="text-sm">
            Status: <strong>{module.status.replaceAll("_", " ")}</strong>
            {module.revisionNote ? ` · ${module.revisionNote}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {isAuthor && (module.status === "DRAFT" || module.status === "DEPT_HEAD_REVISION") ? (
              <Button onClick={() => void act("submitModule")}>Submit to dept head</Button>
            ) : null}
            {isAuthor && module.status === "DEAN_REVISION" ? (
              <Button onClick={() => void act("resubmitModule")}>Resubmit to dean</Button>
            ) : null}
            {(role === "DEPT_HEAD" || role === "ADMIN") && module.status === "DEPT_HEAD_REVIEW" ? (
              <>
                <Button onClick={() => void review("APPROVE")}>Approve</Button>
                <Button variant="outline" onClick={() => void review("REVISE")}>
                  Request revision
                </Button>
              </>
            ) : null}
            {(role === "DEAN" || role === "ADMIN") && module.status === "DEAN_REVIEW" ? (
              <>
                <Button onClick={() => void review("APPROVE")}>Publish</Button>
                <Button variant="outline" onClick={() => void review("REVISE")}>
                  Request revision
                </Button>
              </>
            ) : null}
            <Button asChild variant="outline">
              <a href={`/api/modules/${module.id}/pdf`} target="_blank" rel="noreferrer">
                PDF
              </a>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Outlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {module.outlines.map((outline) => (
                <div key={outline.id} className="rounded-md border p-3">
                  <p className="font-medium">{outline.title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{outline.content}</p>
                </div>
              ))}
              <Input value={outlineTitle} onChange={(event) => setOutlineTitle(event.target.value)} placeholder="Unit title" />
              <Textarea value={outlineContent} onChange={(event) => setOutlineContent(event.target.value)} placeholder="Content" />
              <Button variant="outline" onClick={() => void addOutline()}>
                Add outline
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
