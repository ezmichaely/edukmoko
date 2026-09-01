import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const password = async (value) => hash(value, 10)

  const college = await prisma.college.upsert({
    where: { code: "CET" },
    update: {},
    create: { name: "College of Engineering and Technology", code: "CET" },
  })

  const department = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: "IT" } },
    update: {},
    create: {
      name: "Information Technology",
      code: "IT",
      collegeId: college.id,
    },
  })

  const course = await prisma.course.upsert({
    where: { collegeId_code: { collegeId: college.id, code: "BSIT" } },
    update: {},
    create: {
      name: "Bachelor of Science in Information Technology",
      code: "BSIT",
      collegeId: college.id,
    },
  })

  const subject = await prisma.subject.upsert({
    where: { code: "ITS207" },
    update: {},
    create: {
      code: "ITS207",
      title: "Object Oriented Programming II",
      departmentId: department.id,
      courseId: course.id,
    },
  })

  const schoolYear = await prisma.schoolYear.upsert({
    where: { label: "2025-2026" },
    update: {},
    create: { label: "2025-2026" },
  })

  const semester = await prisma.semester.upsert({
    where: { name: "First Semester" },
    update: {},
    create: { name: "First Semester" },
  })

  const accounts = [
    {
      username: "registeradmin",
      password: "RegisterAdmin",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "Register",
      email: "registeradmin@edukmoko.local",
    },
    {
      username: "registercollegedean",
      password: "RegisterCollegeDean",
      role: "DEAN",
      firstName: "Dean",
      lastName: "Register",
      email: "registercollegedean@edukmoko.local",
    },
    {
      username: "registerdepthead",
      password: "RegisterDeptHead",
      role: "DEPT_HEAD",
      firstName: "DeptHead",
      lastName: "Register",
      email: "registerdepthead@edukmoko.local",
    },
    {
      username: "registerinstructor",
      password: "RegisterInstructor",
      role: "INSTRUCTOR",
      firstName: "Instructor",
      lastName: "Register",
      email: "registerinstructor@edukmoko.local",
    },
    {
      username: "studentregister",
      password: "StudentRegister",
      role: "STUDENT",
      firstName: "Student",
      lastName: "Register",
      email: "studentregister@edukmoko.local",
    },
  ]

  const created = {}
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        passwordHash: await password(account.password),
        accountStatus: "APPROVED",
        role: account.role,
        collegeId: college.id,
        departmentId: department.id,
        courseId: account.role === "STUDENT" ? course.id : null,
      },
      create: {
        username: account.username,
        email: account.email,
        passwordHash: await password(account.password),
        role: account.role,
        accountStatus: "APPROVED",
        firstName: account.firstName,
        lastName: account.lastName,
        collegeId: college.id,
        departmentId: department.id,
        courseId: account.role === "STUDENT" ? course.id : null,
      },
    })
    created[account.role] = user
  }

  const instructor = created.INSTRUCTOR
  const student = created.STUDENT

  const moduleRow = await prisma.module.upsert({
    where: { id: "seed-module-its207" },
    update: { status: "PUBLISHED" },
    create: {
      id: "seed-module-its207",
      title: "OOP II Learning Module",
      intro: "Core object-oriented programming concepts for ITS 207.",
      outcomes: "Students can model, implement, and test OOP designs.",
      consent: "For classroom use only.",
      status: "PUBLISHED",
      subjectId: subject.id,
      authorId: instructor.id,
    },
  })

  await prisma.outline.deleteMany({ where: { moduleId: moduleRow.id } })
  await prisma.outline.createMany({
    data: [
      {
        moduleId: moduleRow.id,
        authorId: instructor.id,
        title: "Unit 1 — Encapsulation",
        content: "Hide internal state and expose a stable interface.",
        order: 0,
      },
      {
        moduleId: moduleRow.id,
        authorId: instructor.id,
        title: "Unit 2 — Inheritance",
        content: "Reuse behavior through class hierarchies.",
        order: 1,
      },
    ],
  })

  const classroom = await prisma.class.upsert({
    where: { joinCode: "CLASS123" },
    update: { moduleId: moduleRow.id },
    create: {
      name: "ITS 207 — Section A",
      joinCode: "CLASS123",
      instructorId: instructor.id,
      moduleId: moduleRow.id,
      schoolYearId: schoolYear.id,
      semesterId: semester.id,
    },
  })

  await prisma.classMember.upsert({
    where: { classId_userId: { classId: classroom.id, userId: instructor.id } },
    update: {},
    create: { classId: classroom.id, userId: instructor.id, role: "INSTRUCTOR" },
  })
  await prisma.classMember.upsert({
    where: { classId_userId: { classId: classroom.id, userId: student.id } },
    update: {},
    create: { classId: classroom.id, userId: student.id, role: "STUDENT" },
  })

  await prisma.post.deleteMany({ where: { authorId: instructor.id, body: { contains: "Welcome to Edukmoko" } } })
  await prisma.post.create({
    data: {
      body: "Welcome to Edukmoko — classes, modules, and a real gradebook live here now.",
      authorId: instructor.id,
    },
  })

  const existingQuiz = await prisma.assessment.findFirst({
    where: { classId: classroom.id, title: "OOP Basics Quiz" },
  })
  if (!existingQuiz) {
    await prisma.assessment.create({
      data: {
        title: "OOP Basics Quiz",
        instructions: "Answer both questions. Multiple choice is auto-scored.",
        type: "QUIZ",
        published: true,
        classId: classroom.id,
        authorId: instructor.id,
        questions: {
          create: [
            {
              prompt: "Which principle hides internal object state?",
              type: "MULTIPLE_CHOICE",
              points: 5,
              order: 0,
              options: {
                create: [
                  { label: "Encapsulation", isCorrect: true },
                  { label: "Polymorphism", isCorrect: false },
                  { label: "Compilation", isCorrect: false },
                ],
              },
            },
            {
              prompt: "Inheritance lets a class reuse another class's behavior.",
              type: "TRUE_FALSE",
              points: 5,
              order: 1,
              options: {
                create: [
                  { label: "True", isCorrect: true },
                  { label: "False", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    })
  }

  await prisma.auditLog.create({
    data: { action: "Seeded Edukmoko demo data", userId: created.ADMIN.id },
  })

  console.log("Seed complete.")
  console.log("Logins (username / password):")
  for (const account of accounts) {
    console.log(`  ${account.username} / ${account.password}`)
  }
  console.log("Class join code: CLASS123")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
