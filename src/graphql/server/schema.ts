import { withAppErrors } from "@/graphql/server/errors"
import type { YogaContext } from "@/graphql/server/context"
import * as assessments from "@/lib/rules/assessments"
import * as catalog from "@/lib/rules/catalog"
import * as classes from "@/lib/rules/classes"
import * as messages from "@/lib/rules/messages"
import * as modules from "@/lib/rules/modules"
import * as social from "@/lib/rules/social"
import * as users from "@/lib/rules/users"

export const typeDefs = /* GraphQL */ `
  enum Role { ADMIN STUDENT INSTRUCTOR DEPT_HEAD DEAN }
  enum AccountStatus { PENDING APPROVED REJECTED }
  enum ModuleStatus { DRAFT DEPT_HEAD_REVIEW DEPT_HEAD_REVISION DEAN_REVIEW DEAN_REVISION PUBLISHED }
  enum AssessmentType { QUIZ ASSIGNMENT PROJECT MAJOR_EXAM }
  enum QuestionType { MULTIPLE_CHOICE TRUE_FALSE SHORT_ANSWER ESSAY FILE_UPLOAD }
  enum AttemptStatus { IN_PROGRESS SUBMITTED GRADED }
  enum ReviewAction { APPROVE REVISE }

  type CatalogRef { id: ID! name: String! code: String! }
  type Semester { id: ID! name: String! }
  type SchoolYear { id: ID! label: String! }

  type User {
    id: ID!
    username: String!
    email: String!
    name: String!
    role: Role!
    accountStatus: AccountStatus!
    firstName: String!
    lastName: String!
    bio: String
    phone: String
    address: String
    avatarUrl: String
    coverUrl: String
    college: CatalogRef
    department: CatalogRef
    course: CatalogRef
    major: CatalogRef
    createdAt: String!
  }

  type CommentAuthor {
    id: ID!
    username: String!
    name: String!
    avatarUrl: String
  }

  type Comment {
    id: ID!
    body: String!
    createdAt: String!
    author: CommentAuthor!
  }

  type Post {
    id: ID!
    body: String!
    imageUrl: String
    createdAt: String!
    author: User!
    comments: [Comment!]!
  }

  type ConversationPreview {
    id: ID!
    updatedAt: String!
    lastMessage: String
    lastMessageAt: String
    other: CommentAuthor
  }

  type ChatMessage {
    id: ID!
    body: String!
    createdAt: String!
    sender: CommentAuthor!
  }

  type Conversation {
    id: ID!
    updatedAt: String!
    lastMessage: String
    lastMessageAt: String
    other: CommentAuthor
    messages: [ChatMessage!]!
  }

  type Outline {
    id: ID!
    title: String!
    content: String!
    order: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Subject {
    id: ID!
    code: String!
    title: String!
    department: Department
    course: Course
  }

  type College { id: ID! name: String! code: String! }
  type Department { id: ID! name: String! code: String! college: College! }
  type Course { id: ID! name: String! code: String! college: College! }
  type Major { id: ID! name: String! code: String! course: Course! }

  type Module {
    id: ID!
    title: String!
    intro: String!
    outcomes: String!
    consent: String
    status: ModuleStatus!
    revisionNote: String
    subject: Subject!
    author: User!
    outlines: [Outline!]!
    createdAt: String!
    updatedAt: String!
  }

  type ClassMember {
    id: ID!
    role: String!
    user: User!
  }

  type ClassModule {
    id: ID!
    title: String!
    status: String!
    subject: Subject!
    outlines: [Outline!]!
  }

  type Class {
    id: ID!
    name: String!
    joinCode: String!
    createdAt: String!
    instructor: User!
    schoolYear: SchoolYear
    semester: Semester
    module: ClassModule
    members: [ClassMember!]!
  }

  type QuestionOption {
    id: ID!
    label: String!
    isCorrect: Boolean!
  }

  type Question {
    id: ID!
    prompt: String!
    type: QuestionType!
    points: Float!
    order: Int!
    options: [QuestionOption!]!
  }

  type Assessment {
    id: ID!
    title: String!
    instructions: String!
    type: AssessmentType!
    published: Boolean!
    dueAt: String
    maxScore: Float!
    questions: [Question!]!
    createdAt: String!
  }

  type Answer {
    id: ID!
    textValue: String
    optionId: ID
    fileUrl: String
    pointsAwarded: Float
    questionId: ID!
  }

  type Attempt {
    id: ID!
    status: AttemptStatus!
    score: Float
    submittedAt: String
    createdAt: String!
    answers: [Answer!]!
    student: User
  }

  type GradeCell {
    id: ID!
    score: Float!
    maxScore: Float!
    assessmentId: ID
    assessmentTitle: String!
  }

  type GradeRow {
    student: User!
    entries: [GradeCell!]!
    totalScore: Float!
    totalMax: Float!
  }

  type AuditLog {
    id: ID!
    action: String!
    createdAt: String!
    user: User
  }

  type Catalog {
    colleges: [College!]!
    departments: [Department!]!
    courses: [Course!]!
    majors: [Major!]!
    subjects: [Subject!]!
    schoolYears: [SchoolYear!]!
    semesters: [Semester!]!
  }

  input CatalogInput {
    id: ID
    name: String!
    code: String!
    collegeId: ID
    courseId: ID
    title: String
    departmentId: ID
  }

  input OutlineInput {
    id: ID
    moduleId: ID!
    title: String!
    content: String!
    order: Int
  }

  input OptionInput {
    label: String!
    isCorrect: Boolean!
  }

  input QuestionInput {
    prompt: String!
    type: QuestionType!
    points: Float!
    options: [OptionInput!]
  }

  input AnswerInput {
    questionId: ID!
    optionId: ID
    textValue: String
    fileUrl: String
  }

  input GradeScoreInput {
    answerId: ID!
    pointsAwarded: Float!
  }

  type Query {
    me: User!
    user(username: String!): User!
    users(role: Role, accountStatus: AccountStatus): [User!]!
    feed: [Post!]!
    post(id: ID!): Post!
    conversations: [ConversationPreview!]!
    conversation(id: ID!): Conversation!
    catalog: Catalog!
    modules(mine: Boolean, status: ModuleStatus): [Module!]!
    module(id: ID!): Module!
    myClasses: [Class!]!
    classByCode(joinCode: String!): Class!
    assessments(classId: ID!): [Assessment!]!
    assessment(id: ID!): Assessment!
    myAttempt(assessmentId: ID!): Attempt
    attempts(assessmentId: ID!): [Attempt!]!
    classRecord(classId: ID!): [GradeRow!]!
    auditLogs: [AuditLog!]!
  }

  type Mutation {
    updateProfile(firstName: String, lastName: String, bio: String, phone: String, address: String, avatarUrl: String, coverUrl: String): User!
    setAccountStatus(userId: ID!, accountStatus: AccountStatus!): User!
    createPost(body: String!, imageUrl: String): Post!
    deletePost(id: ID!): Boolean!
    addComment(postId: ID!, body: String!): Post!
    startConversation(username: String!): Conversation!
    sendMessage(conversationId: ID!, body: String!): Conversation!
    upsertCollege(input: CatalogInput!): College!
    upsertDepartment(input: CatalogInput!): Department!
    upsertCourse(input: CatalogInput!): Course!
    upsertMajor(input: CatalogInput!): Major!
    upsertSubject(input: CatalogInput!): Subject!
    deleteCatalog(kind: String!, id: ID!): Boolean!
    createModule(title: String!, intro: String!, outcomes: String!, consent: String, subjectId: ID!): Module!
    updateModule(id: ID!, title: String, intro: String, outcomes: String, consent: String): Module!
    saveOutline(input: OutlineInput!): Module!
    deleteOutline(id: ID!): Module!
    submitModule(id: ID!): Module!
    reviewModule(id: ID!, action: ReviewAction!, note: String): Module!
    resubmitModule(id: ID!): Module!
    createClass(name: String!, moduleId: ID, schoolYearId: ID, semesterId: ID): Class!
    joinClass(joinCode: String!): Class!
    attachModule(classId: ID!, moduleId: ID!): Class!
    createAssessment(classId: ID!, title: String!, instructions: String!, type: AssessmentType!, dueAt: String, questions: [QuestionInput!]!): Assessment!
    publishAssessment(id: ID!, published: Boolean!): Assessment!
    submitAttempt(assessmentId: ID!, answers: [AnswerInput!]!): Attempt!
    gradeAttempt(attemptId: ID!, scores: [GradeScoreInput!]!): Attempt!
  }
`

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => users.getMe(ctx.session)),
    user: (_: unknown, args: { username: string }, ctx: YogaContext) =>
      withAppErrors(() => users.getUserByUsername(ctx.session, args.username)),
    users: (
      _: unknown,
      args: { role?: users.UserRecord["role"]; accountStatus?: users.UserRecord["accountStatus"] },
      ctx: YogaContext,
    ) => withAppErrors(() => users.listUsers(ctx.session, args)),
    feed: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => social.listFeed(ctx.session)),
    post: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => social.getPost(ctx.session, args.id)),
    conversations: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => messages.listConversations(ctx.session)),
    conversation: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => messages.getConversation(ctx.session, args.id)),
    catalog: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => catalog.listCatalog(ctx.session)),
    modules: (_: unknown, args: { mine?: boolean; status?: import("@prisma/client").ModuleStatus }, ctx: YogaContext) =>
      withAppErrors(() => modules.listModules(ctx.session, args)),
    module: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => modules.getModule(ctx.session, args.id)),
    myClasses: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => classes.listMyClasses(ctx.session)),
    classByCode: (_: unknown, args: { joinCode: string }, ctx: YogaContext) =>
      withAppErrors(() => classes.getClassByCode(ctx.session, args.joinCode)),
    assessments: (_: unknown, args: { classId: string }, ctx: YogaContext) =>
      withAppErrors(() => assessments.listAssessments(ctx.session, args.classId)),
    assessment: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => assessments.getAssessment(ctx.session, args.id)),
    myAttempt: (_: unknown, args: { assessmentId: string }, ctx: YogaContext) =>
      withAppErrors(() => assessments.getMyAttempt(ctx.session, args.assessmentId)),
    attempts: (_: unknown, args: { assessmentId: string }, ctx: YogaContext) =>
      withAppErrors(() => assessments.listAttempts(ctx.session, args.assessmentId)),
    classRecord: (_: unknown, args: { classId: string }, ctx: YogaContext) =>
      withAppErrors(() => assessments.classRecord(ctx.session, args.classId)),
    auditLogs: (_: unknown, __: unknown, ctx: YogaContext) =>
      withAppErrors(() => users.listAuditLogs(ctx.session)),
  },
  Mutation: {
    updateProfile: (_: unknown, args: Parameters<typeof users.updateMyProfile>[1], ctx: YogaContext) =>
      withAppErrors(() => users.updateMyProfile(ctx.session, args)),
    setAccountStatus: (
      _: unknown,
      args: { userId: string; accountStatus: users.UserRecord["accountStatus"] },
      ctx: YogaContext,
    ) => withAppErrors(() => users.setAccountStatus(ctx.session, args.userId, args.accountStatus)),
    createPost: (_: unknown, args: { body: string; imageUrl?: string }, ctx: YogaContext) =>
      withAppErrors(() => social.createPost(ctx.session, args)),
    deletePost: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => social.deletePost(ctx.session, args.id)),
    addComment: (_: unknown, args: { postId: string; body: string }, ctx: YogaContext) =>
      withAppErrors(() => social.addComment(ctx.session, args.postId, args.body)),
    startConversation: (_: unknown, args: { username: string }, ctx: YogaContext) =>
      withAppErrors(() => messages.startConversation(ctx.session, args.username)),
    sendMessage: (_: unknown, args: { conversationId: string; body: string }, ctx: YogaContext) =>
      withAppErrors(() => messages.sendMessage(ctx.session, args.conversationId, args.body)),
    upsertCollege: (_: unknown, args: { input: { id?: string; name: string; code: string } }, ctx: YogaContext) =>
      withAppErrors(() => catalog.upsertCollege(ctx.session, args.input)),
    upsertDepartment: (
      _: unknown,
      args: { input: { id?: string; name: string; code: string; collegeId: string } },
      ctx: YogaContext,
    ) => withAppErrors(() => catalog.upsertDepartment(ctx.session, args.input)),
    upsertCourse: (
      _: unknown,
      args: { input: { id?: string; name: string; code: string; collegeId: string } },
      ctx: YogaContext,
    ) => withAppErrors(() => catalog.upsertCourse(ctx.session, args.input)),
    upsertMajor: (
      _: unknown,
      args: { input: { id?: string; name: string; code: string; courseId: string } },
      ctx: YogaContext,
    ) => withAppErrors(() => catalog.upsertMajor(ctx.session, args.input)),
    upsertSubject: (
      _: unknown,
      args: { input: { id?: string; code: string; title: string; departmentId?: string; courseId?: string } },
      ctx: YogaContext,
    ) => withAppErrors(() => catalog.upsertSubject(ctx.session, args.input)),
    deleteCatalog: (_: unknown, args: { kind: "college" | "department" | "course" | "major" | "subject"; id: string }, ctx: YogaContext) =>
      withAppErrors(() => catalog.deleteCatalogRow(ctx.session, args.kind, args.id)),
    createModule: (
      _: unknown,
      args: { title: string; intro: string; outcomes: string; consent?: string; subjectId: string },
      ctx: YogaContext,
    ) => withAppErrors(() => modules.createModule(ctx.session, args)),
    updateModule: (
      _: unknown,
      args: { id: string; title?: string; intro?: string; outcomes?: string; consent?: string },
      ctx: YogaContext,
    ) => withAppErrors(() => modules.updateModule(ctx.session, args)),
    saveOutline: (_: unknown, args: { input: Parameters<typeof modules.saveOutline>[1] }, ctx: YogaContext) =>
      withAppErrors(() => modules.saveOutline(ctx.session, args.input)),
    deleteOutline: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => modules.deleteOutline(ctx.session, args.id)),
    submitModule: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => modules.submitModuleForReview(ctx.session, args.id)),
    reviewModule: (
      _: unknown,
      args: { id: string; action: "APPROVE" | "REVISE"; note?: string },
      ctx: YogaContext,
    ) => withAppErrors(() => modules.reviewModule(ctx.session, args)),
    resubmitModule: (_: unknown, args: { id: string }, ctx: YogaContext) =>
      withAppErrors(() => modules.resubmitFromDeanRevision(ctx.session, args.id)),
    createClass: (
      _: unknown,
      args: { name: string; moduleId?: string; schoolYearId?: string; semesterId?: string },
      ctx: YogaContext,
    ) => withAppErrors(() => classes.createClass(ctx.session, args)),
    joinClass: (_: unknown, args: { joinCode: string }, ctx: YogaContext) =>
      withAppErrors(() => classes.joinClass(ctx.session, args.joinCode)),
    attachModule: (_: unknown, args: { classId: string; moduleId: string }, ctx: YogaContext) =>
      withAppErrors(() => classes.attachModuleToClass(ctx.session, args.classId, args.moduleId)),
    createAssessment: (
      _: unknown,
      args: Parameters<typeof assessments.createAssessment>[1],
      ctx: YogaContext,
    ) => withAppErrors(() => assessments.createAssessment(ctx.session, args)),
    publishAssessment: (_: unknown, args: { id: string; published: boolean }, ctx: YogaContext) =>
      withAppErrors(() => assessments.publishAssessment(ctx.session, args.id, args.published)),
    submitAttempt: (
      _: unknown,
      args: Parameters<typeof assessments.submitAttempt>[1],
      ctx: YogaContext,
    ) => withAppErrors(() => assessments.submitAttempt(ctx.session, args)),
    gradeAttempt: (
      _: unknown,
      args: Parameters<typeof assessments.gradeAttempt>[1],
      ctx: YogaContext,
    ) => withAppErrors(() => assessments.gradeAttempt(ctx.session, args)),
  },
}
