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

type Option = { id: string; label: string; isCorrect: boolean }
type Question = { id: string; prompt: string; type: string; points: number; options: Option[] }
type Assessment = {
  id: string
  title: string
  instructions: string
  type: string
  published: boolean
  questions: Question[]
}
type Attempt = { id: string; status: string; score: number | null; answers: { id: string; questionId: string; pointsAwarded: number | null }[] }

export function NewAssessmentForm({
  classId,
  joinCode,
  basePath,
}: {
  classId: string
  joinCode: string
  basePath: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState("New quiz")
  const [instructions, setInstructions] = useState("Answer all questions.")
  const [type, setType] = useState("QUIZ")
  const [prompt, setPrompt] = useState("Which option is correct?")
  const [optionA, setOptionA] = useState("Correct answer")
  const [optionB, setOptionB] = useState("Wrong answer")

  async function create() {
    try {
      const data = await graphqlRequest<{ createAssessment: { id: string } }>(
        `mutation Create($classId: ID!, $title: String!, $instructions: String!, $type: AssessmentType!, $questions: [QuestionInput!]!) {
          createAssessment(classId: $classId, title: $title, instructions: $instructions, type: $type, questions: $questions) { id }
        }`,
        {
          classId,
          title,
          instructions,
          type,
          questions: [
            {
              prompt,
              type: "MULTIPLE_CHOICE",
              points: 5,
              options: [
                { label: optionA, isCorrect: true },
                { label: optionB, isCorrect: false },
              ],
            },
          ],
        },
      )
      await graphqlRequest(
        `mutation Publish($id: ID!, $published: Boolean!) { publishAssessment(id: $id, published: $published) { id } }`,
        { id: data.createAssessment.id, published: true },
      )
      router.push(`${basePath}/classes/${joinCode}/assessments/${data.createAssessment.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create")
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="New assessment" />
      <Card>
        <CardContent className="space-y-3 py-4">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          <select
            className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option>QUIZ</option>
            <option>ASSIGNMENT</option>
            <option>PROJECT</option>
            <option>MAJOR_EXAM</option>
          </select>
          <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} />
          <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Question" />
          <Input value={optionA} onChange={(event) => setOptionA(event.target.value)} placeholder="Correct option" />
          <Input value={optionB} onChange={(event) => setOptionB(event.target.value)} placeholder="Incorrect option" />
          <Button onClick={() => void create()}>Publish assessment</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function AssessmentPanel({
  assessmentId,
  role,
}: {
  assessmentId: string
  role: Role
}) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState<{ id: string; status: string; score: number | null; student?: { name: string } }[]>([])

  async function load() {
    const data = await graphqlRequest<{ assessment: Assessment; myAttempt: Attempt | null }>(
      `query Assessment($id: ID!) {
        assessment(id: $id) {
          id title instructions type published
          questions { id prompt type points options { id label isCorrect } }
        }
        myAttempt(assessmentId: $id) { id status score answers { id questionId pointsAwarded } }
      }`,
      { id: assessmentId },
    )
    setAssessment(data.assessment)
    setAttempt(data.myAttempt)
    if (role !== "STUDENT") {
      const list = await graphqlRequest<{ attempts: typeof attempts }>(
        `query Attempts($assessmentId: ID!) {
          attempts(assessmentId: $assessmentId) { id status score student { name } }
        }`,
        { assessmentId },
      )
      setAttempts(list.attempts)
    }
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [assessmentId, role])

  async function submit() {
    if (!assessment) {
      return
    }
    try {
      const data = await graphqlRequest<{ submitAttempt: Attempt }>(
        `mutation Submit($assessmentId: ID!, $answers: [AnswerInput!]!) {
          submitAttempt(assessmentId: $assessmentId, answers: $answers) { id status score answers { id questionId pointsAwarded } }
        }`,
        {
          assessmentId,
          answers: assessment.questions.map((question) => ({
            questionId: question.id,
            optionId: answers[question.id] || null,
          })),
        },
      )
      setAttempt(data.submitAttempt)
      toast.success(`Submitted. Score: ${data.submitAttempt.score ?? "pending"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed")
    }
  }

  if (!assessment) {
    return <p className="text-sm text-muted-foreground">Loading assessment…</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader title={assessment.title} description={assessment.instructions} />
      {role === "STUDENT" && !attempt ? (
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessment.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="font-medium">{question.prompt}</p>
                {question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            ))}
            <Button onClick={() => void submit()}>Submit</Button>
          </CardContent>
        </Card>
      ) : null}
      {attempt ? (
        <Card>
          <CardContent className="py-4 text-sm">
            Status {attempt.status}. Score {attempt.score ?? "pending manual grading"}.
          </CardContent>
        </Card>
      ) : null}
      {role !== "STUDENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attempts.map((item) => (
              <p key={item.id} className="text-sm">
                {item.student?.name}: {item.status} {item.score ?? ""}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
