import "server-only"

import { prisma } from "@/lib/prisma"
import { displayName } from "@/lib/names"
import { AppForbiddenError, AppInputError, AppNotFoundError } from "@/lib/rules/errors"
import { requireUser, type SessionUser } from "@/lib/session"
import { toGraphqlUser, userPublicSelect } from "@/lib/rules/users"

const postInclude = {
  author: { select: userPublicSelect },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  },
}

export async function listFeed(session: SessionUser | null) {
  requireUser(session)
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  })
  return posts.map(mapPost)
}

export async function getPost(session: SessionUser | null, id: string) {
  requireUser(session)
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  })
  if (!post) {
    throw new AppNotFoundError("Post not found.")
  }
  return mapPost(post)
}

export async function createPost(
  session: SessionUser | null,
  input: { body: string; imageUrl?: string | null },
) {
  const current = requireUser(session)
  const body = input.body.trim()
  if (!body) {
    throw new AppInputError("Post body is required.")
  }
  const post = await prisma.post.create({
    data: {
      body,
      imageUrl: input.imageUrl || null,
      authorId: current.id,
    },
    include: postInclude,
  })
  return mapPost(post)
}

export async function deletePost(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) {
    throw new AppNotFoundError("Post not found.")
  }
  if (post.authorId !== current.id && current.role !== "ADMIN") {
    throw new AppForbiddenError("You cannot delete this post.")
  }
  await prisma.post.delete({ where: { id } })
  return true
}

export async function addComment(
  session: SessionUser | null,
  postId: string,
  body: string,
) {
  const current = requireUser(session)
  const text = body.trim()
  if (!text) {
    throw new AppInputError("Comment is required.")
  }
  await prisma.comment.create({
    data: { postId, body: text, authorId: current.id },
  })
  return getPost(session, postId)
}

function mapPost(post: {
  id: string
  body: string
  imageUrl: string | null
  createdAt: Date
  author: Parameters<typeof toGraphqlUser>[0]
  comments: {
    id: string
    body: string
    createdAt: Date
    author: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatarUrl: string | null
    }
  }[]
}) {
  return {
    id: post.id,
    body: post.body,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt.toISOString(),
    author: toGraphqlUser(post.author),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        username: comment.author.username,
        name: displayName(comment.author),
        avatarUrl: comment.author.avatarUrl,
      },
    })),
  }
}
