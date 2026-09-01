"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Role } from "@prisma/client"

type Classroom = {
  id: string
  name: string
  joinCode: string
  instructor: { name: string; username: string }
  module: {
    id: string
    title: string
    subject: { code: string; title: string }
    outlines: { id: string; title: string; content: string }[]
  } | null
  members: { id: string; role: string; user: { name: string; username: string } }[]
}

type Assessment = {
  id: string
  title: string
  type: string
  published: boolean
  maxScore: number
}

type GradeRow = {
  student: { name: string; username: string }
  totalScore: number
  totalMax: number
  entries: { assessmentTitle: string; score: number; maxScore: number }[]
}

export function ClassDetailPanel({
  basePath,
  joinCode,
  role,
}: {
  basePath: string
  joinCode: string
  role: Role
}) {
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [record, setRecord] = useState<GradeRow[]>([])
  const canTeach = role === "INSTRUCTOR" || role === "DEPT_HEAD" || role === "ADMIN"

  async function load() {
    const data = await graphqlRequest<{ classByCode: Classroom }>(
      `query Class($joinCode: String!) {
        classByCode(joinCode: $joinCode) {
          id name joinCode
          instructor { name username }
          module { id title subject { code title } outlines { id title content } }
          members { id role user { name username } }
        }
      }`,
      { joinCode },
    )
    setClassroom(data.classByCode)
    const assessmentData = await graphqlRequest<{ assessments: Assessment[] }>(
      `query Assessments($classId: ID!) { assessments(classId: $classId) { id title type published maxScore } }`,
      { classId: data.classByCode.id },
    )
    setAssessments(assessmentData.assessments)
    const recordData = await graphqlRequest<{ classRecord: GradeRow[] }>(
      `query Record($classId: ID!) {
        classRecord(classId: $classId) {
          student { name username }
          totalScore totalMax
          entries { assessmentTitle score maxScore }
        }
      }`,
      { classId: data.classByCode.id },
    )
    setRecord(recordData.classRecord)
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [joinCode])

  if (!classroom) {
    return <p className="text-sm text-muted-foreground">Loading class…</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={classroom.name}
        description={`Join code ${classroom.joinCode} · ${classroom.instructor.name}`}
        actions={
          canTeach ? (
            <Button asChild>
              <Link href={`${basePath}/classes/${joinCode}/assessments/new`}>New assessment</Link>
            </Button>
          ) : null
        }
      />
      <Tabs defaultValue="home">
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="lesson">Lesson</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="record">Class record</TabsTrigger>
        </TabsList>
        <TabsContent value="home" className="space-y-3">
          <Card>
            <CardContent className="py-4 text-sm">
              {classroom.module
                ? `Attached module: ${classroom.module.title}`
                : "No published module attached yet."}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lesson" className="space-y-3">
          {classroom.module?.outlines.map((outline) => (
            <Card key={outline.id}>
              <CardContent className="space-y-2 py-4">
                <p className="font-medium">{outline.title}</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{outline.content}</p>
              </CardContent>
            </Card>
          )) ?? <p className="text-sm text-muted-foreground">No lesson content yet.</p>}
          {classroom.module ? (
            <Button asChild variant="outline">
              <a href={`/api/modules/${classroom.module.id}/pdf`} target="_blank" rel="noreferrer">
                Download module PDF
              </a>
            </Button>
          ) : null}
        </TabsContent>
        <TabsContent value="members">
          <div className="space-y-2">
            {classroom.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex justify-between py-3 text-sm">
                  <Link href={`${basePath}/u/${member.user.username}`} className="hover:underline">
                    {member.user.name}
                  </Link>
                  <span className="text-muted-foreground">{member.role}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="assessments" className="space-y-2">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{assessment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assessment.type} · {assessment.maxScore} pts
                    {assessment.published ? "" : " · draft"}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`${basePath}/classes/${joinCode}/assessments/${assessment.id}`}>
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="record">
          <div className="space-y-2">
            {record.map((row) => (
              <Card key={row.student.username}>
                <CardContent className="py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{row.student.name}</span>
                    <span>
                      {row.totalScore}/{row.totalMax || 0}
                    </span>
                  </div>
                  {row.entries.map((entry) => (
                    <p key={entry.assessmentTitle} className="text-muted-foreground">
                      {entry.assessmentTitle}: {entry.score}/{entry.maxScore}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

