import "server-only"

import type { AssessmentType, Prisma, QuestionType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { writeAuditLog } from "@/lib/queries/auth"
import {
  AppForbiddenError,
  AppInputError,
  AppNotFoundError,
} from "@/lib/rules/errors"
import { toGraphqlUser, userPublicSelect } from "@/lib/rules/users"
import { requireUser, type SessionUser } from "@/lib/session"
import { TEACHING_ROLES } from "@/lib/roles"

const assessmentInclude = {
  questions: {
    orderBy: { order: "asc" as const },
    include: { options: true },
  },
  class: { select: { id: true, name: true, joinCode: true, instructorId: true } },
} satisfies Prisma.AssessmentInclude

function canTeach(session: SessionUser) {
  return TEACHING_ROLES.includes(session.role) || session.role === "ADMIN"
}

async function assertClassAccess(session: SessionUser, classId: string, asTeacher = false) {
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: { members: true },
  })
  if (!classroom) {
    throw new AppNotFoundError("Class not found.")
  }
  const isMember = classroom.members.some((member) => member.userId === session.id)
  const isInstructor = classroom.instructorId === session.id
  if (asTeacher) {
    if (!isInstructor && !canTeach(session)) {
      throw new AppForbiddenError()
    }
  } else if (!isMember && !isInstructor && session.role !== "ADMIN") {
    throw new AppForbiddenError()
  }
  return classroom
}

function mapAssessment(
  row: Prisma.AssessmentGetPayload<{ include: typeof assessmentInclude }>,
) {
  return {
    ...row,
    dueAt: row.dueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    maxScore: row.questions.reduce((sum, question) => sum + question.points, 0),
  }
}

export async function listAssessments(session: SessionUser | null, classId: string) {
  const current = requireUser(session)
  await assertClassAccess(current, classId)
  const rows = await prisma.assessment.findMany({
    where: {
      classId,
      published: current.role === "STUDENT" ? true : undefined,
    },
    include: assessmentInclude,
    orderBy: { createdAt: "desc" },
  })
  return rows.map((row) => redactAssessment(mapAssessment(row), current.role === "STUDENT"))
}

export async function getAssessment(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const row = await prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude,
  })
  if (!row) {
    throw new AppNotFoundError("Assessment not found.")
  }
  await assertClassAccess(current, row.classId)
  if (current.role === "STUDENT" && !row.published) {
    throw new AppNotFoundError("Assessment not found.")
  }
  return redactAssessment(mapAssessment(row), current.role === "STUDENT")
}

function redactAssessment<T extends { questions: { options: { isCorrect: boolean }[] }[] }>(
  assessment: T,
  hideAnswers: boolean,
): T {
  if (!hideAnswers) {
    return assessment
  }
  return {
    ...assessment,
    questions: assessment.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option, isCorrect: false })),
    })),
  }
}

export async function createAssessment(
  session: SessionUser | null,
  input: {
    classId: string
    title: string
    instructions: string
    type: AssessmentType
    dueAt?: string | null
    questions: {
      prompt: string
      type: QuestionType
      points: number
      options?: { label: string; isCorrect: boolean }[]
    }[]
  },
) {
  const current = requireUser(session)
  await assertClassAccess(current, input.classId, true)
  const title = input.title.trim()
  if (!title) {
    throw new AppInputError("Title is required.")
  }
  const row = await prisma.assessment.create({
    data: {
      title,
      instructions: input.instructions.trim(),
      type: input.type,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      classId: input.classId,
      authorId: current.id,
      questions: {
        create: input.questions.map((question, index) => ({
          prompt: question.prompt.trim(),
          type: question.type,
          points: question.points,
          order: index,
          options: question.options
            ? { create: question.options.map((option) => ({ label: option.label, isCorrect: option.isCorrect })) }
            : undefined,
        })),
      },
    },
    include: assessmentInclude,
  })
  await writeAuditLog(`${current.username} created ${input.type} ${title}`, current.id)
  return mapAssessment(row)
}

export async function publishAssessment(
  session: SessionUser | null,
  id: string,
  published: boolean,
) {
  const current = requireUser(session)
  const existing = await prisma.assessment.findUnique({ where: { id } })
  if (!existing) {
    throw new AppNotFoundError("Assessment not found.")
  }
  await assertClassAccess(current, existing.classId, true)
  const row = await prisma.assessment.update({
    where: { id },
    data: { published },
    include: assessmentInclude,
  })
  return mapAssessment(row)
}

export async function getMyAttempt(session: SessionUser | null, assessmentId: string) {
  const current = requireUser(session)
  return prisma.attempt.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId: current.id } },
    include: { answers: true },
  })
}

export async function submitAttempt(
  session: SessionUser | null,
  input: {
    assessmentId: string
    answers: { questionId: string; optionId?: string | null; textValue?: string | null; fileUrl?: string | null }[]
  },
) {
  const current = requireUser(session)
  const assessment = await prisma.assessment.findUnique({
    where: { id: input.assessmentId },
    include: { questions: { include: { options: true } }, class: true },
  })
  if (!assessment || !assessment.published) {
    throw new AppNotFoundError("Assessment not found.")
  }
  await assertClassAccess(current, assessment.classId)

  let autoScore = 0
  let maxAuto = 0
  const answerCreates = assessment.questions.map((question) => {
    const given = input.answers.find((answer) => answer.questionId === question.id)
    let pointsAwarded: number | null = null
    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      maxAuto += question.points
      const correct = question.options.find((option) => option.isCorrect)
      const isCorrect = Boolean(correct && given?.optionId === correct.id)
      pointsAwarded = isCorrect ? question.points : 0
      autoScore += pointsAwarded
    }
    return {
      questionId: question.id,
      optionId: given?.optionId || null,
      textValue: given?.textValue || null,
      fileUrl: given?.fileUrl || null,
      pointsAwarded,
    }
  })

  const needsManual = assessment.questions.some(
    (question) =>
      question.type === "SHORT_ANSWER" ||
      question.type === "ESSAY" ||
      question.type === "FILE_UPLOAD",
  )

  const attempt = await prisma.attempt.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: assessment.id,
        studentId: current.id,
      },
    },
    update: {
      status: needsManual ? "SUBMITTED" : "GRADED",
      score: needsManual ? autoScore : autoScore,
      submittedAt: new Date(),
      answers: {
        deleteMany: {},
        create: answerCreates,
      },
    },
    create: {
      assessmentId: assessment.id,
      studentId: current.id,
      status: needsManual ? "SUBMITTED" : "GRADED",
      score: autoScore,
      submittedAt: new Date(),
      answers: { create: answerCreates },
    },
    include: { answers: true, student: true },
  })

  const maxScore = assessment.questions.reduce((sum, question) => sum + question.points, 0)
  if (!needsManual) {
    await prisma.gradeEntry.upsert({
      where: {
        classId_studentId_assessmentId: {
          classId: assessment.classId,
          studentId: current.id,
          assessmentId: assessment.id,
        },
      },
      update: { score: autoScore, maxScore, graderId: current.id },
      create: {
        classId: assessment.classId,
        studentId: current.id,
        assessmentId: assessment.id,
        score: autoScore,
        maxScore,
        graderId: current.id,
      },
    })
  }

  return {
    ...attempt,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString(),
    maxAuto,
  }
}

export async function gradeAttempt(
  session: SessionUser | null,
  input: {
    attemptId: string
    scores: { answerId: string; pointsAwarded: number }[]
  },
) {
  const current = requireUser(session)
  const attempt = await prisma.attempt.findUnique({
    where: { id: input.attemptId },
    include: {
      answers: { include: { question: true } },
      assessment: true,
    },
  })
  if (!attempt) {
    throw new AppNotFoundError("Attempt not found.")
  }
  await assertClassAccess(current, attempt.assessment.classId, true)

  let total = 0
  for (const answer of attempt.answers) {
    const override = input.scores.find((score) => score.answerId === answer.id)
    const points =
      override !== undefined ? override.pointsAwarded : answer.pointsAwarded ?? 0
    total += points
    await prisma.answer.update({
      where: { id: answer.id },
      data: { pointsAwarded: points },
    })
  }

  const maxScore = attempt.answers.reduce((sum, answer) => sum + answer.question.points, 0)
  const updated = await prisma.attempt.update({
    where: { id: attempt.id },
    data: { status: "GRADED", score: total },
    include: { answers: true, student: true },
  })

  await prisma.gradeEntry.upsert({
    where: {
      classId_studentId_assessmentId: {
        classId: attempt.assessment.classId,
        studentId: attempt.studentId,
        assessmentId: attempt.assessmentId,
      },
    },
    update: { score: total, maxScore, graderId: current.id },
    create: {
      classId: attempt.assessment.classId,
      studentId: attempt.studentId,
      assessmentId: attempt.assessmentId,
      score: total,
      maxScore,
      graderId: current.id,
    },
  })

  return {
    ...updated,
    submittedAt: updated.submittedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    student: toGraphqlUser(
      await prisma.user.findUniqueOrThrow({
        where: { id: updated.studentId },
        select: userPublicSelect,
      }),
    ),
  }
}

export async function classRecord(session: SessionUser | null, classId: string) {
  const current = requireUser(session)
  await assertClassAccess(current, classId)
  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      members: {
        where: { role: "STUDENT" },
        include: {
          user: { select: userPublicSelect },
        },
      },
      assessments: true,
      gradeEntries: true,
    },
  })
  if (!classroom) {
    throw new AppNotFoundError("Class not found.")
  }

  return classroom.members.map((member) => {
    const entries = classroom.gradeEntries.filter(
      (entry) => entry.studentId === member.userId,
    )
    const score = entries.reduce((sum, entry) => sum + entry.score, 0)
    const maxScore = entries.reduce((sum, entry) => sum + entry.maxScore, 0)
    return {
      student: toGraphqlUser(member.user),
      entries: entries.map((entry) => ({
        id: entry.id,
        score: entry.score,
        maxScore: entry.maxScore,
        assessmentId: entry.assessmentId,
        assessmentTitle:
          classroom.assessments.find((assessment) => assessment.id === entry.assessmentId)
            ?.title ?? "Assessment",
      })),
      totalScore: score,
      totalMax: maxScore,
    }
  })
}

export async function listAttempts(session: SessionUser | null, assessmentId: string) {
  const current = requireUser(session)
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } })
  if (!assessment) {
    throw new AppNotFoundError("Assessment not found.")
  }
  await assertClassAccess(current, assessment.classId, true)
  const attempts = await prisma.attempt.findMany({
    where: { assessmentId },
    include: {
      student: {
        select: userPublicSelect,
      },
      answers: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return attempts.map((attempt) => ({
    ...attempt,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString(),
    student: toGraphqlUser(attempt.student),
  }))
}
