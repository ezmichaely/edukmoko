import "server-only"

import { prisma } from "@/lib/prisma"
import { displayName } from "@/lib/names"
import { AppInputError, AppNotFoundError } from "@/lib/rules/errors"
import { requireUser, type SessionUser } from "@/lib/session"

export async function listConversations(session: SessionUser | null) {
  const current = requireUser(session)
  const rows = await prisma.conversationParticipant.findMany({
    where: { userId: current.id },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
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
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  })

  return rows
    .map((row) => mapConversation(row.conversation, current.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getConversation(session: SessionUser | null, id: string) {
  const current = requireUser(session)
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
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
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
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
    },
  })
  if (!conversation || !conversation.participants.some((p) => p.userId === current.id)) {
    throw new AppNotFoundError("Conversation not found.")
  }
  return {
    ...mapConversation(conversation, current.id),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        name: displayName(message.sender),
        avatarUrl: message.sender.avatarUrl,
      },
    })),
  }
}

export async function startConversation(
  session: SessionUser | null,
  username: string,
) {
  const current = requireUser(session)
  const other = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  })
  if (!other) {
    throw new AppNotFoundError("User not found.")
  }
  if (other.id === current.id) {
    throw new AppInputError("You cannot message yourself.")
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: current.id } } },
        { participants: { some: { userId: other.id } } },
      ],
    },
  })
  if (existing) {
    return getConversation(session, existing.id)
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: current.id }, { userId: other.id }],
      },
    },
  })
  return getConversation(session, conversation.id)
}

export async function sendMessage(
  session: SessionUser | null,
  conversationId: string,
  body: string,
) {
  const current = requireUser(session)
  const text = body.trim()
  if (!text) {
    throw new AppInputError("Message is required.")
  }
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: current.id },
    },
  })
  if (!participant) {
    throw new AppNotFoundError("Conversation not found.")
  }
  await prisma.message.create({
    data: { conversationId, senderId: current.id, body: text },
  })
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })
  return getConversation(session, conversationId)
}

function mapConversation(
  conversation: {
    id: string
    updatedAt: Date
    participants: {
      userId: string
      user: {
        id: string
        username: string
        firstName: string
        lastName: string
        avatarUrl: string | null
      }
    }[]
    messages: { body: string; createdAt: Date }[]
  },
  currentUserId: string,
) {
  const other = conversation.participants.find((p) => p.userId !== currentUserId)?.user
  const last = conversation.messages[0]
  return {
    id: conversation.id,
    updatedAt: conversation.updatedAt.toISOString(),
    other: other
      ? {
          id: other.id,
          username: other.username,
          name: displayName(other),
          avatarUrl: other.avatarUrl,
        }
      : null,
    lastMessage: last?.body ?? null,
    lastMessageAt: last?.createdAt.toISOString() ?? conversation.updatedAt.toISOString(),
  }
}
