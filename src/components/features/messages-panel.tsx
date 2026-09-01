"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Preview = {
  id: string
  lastMessage: string | null
  other: { name: string; username: string } | null
}

type Conversation = {
  id: string
  other: { name: string } | null
  messages: { id: string; body: string; sender: { name: string }; createdAt: string }[]
}

export function MessagesPanel() {
  const [list, setList] = useState<Preview[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [username, setUsername] = useState("")
  const [body, setBody] = useState("")

  async function loadList() {
    const data = await graphqlRequest<{ conversations: Preview[] }>(
      `query { conversations { id lastMessage other { name username } } }`,
    )
    setList(data.conversations)
  }

  async function open(id: string) {
    const data = await graphqlRequest<{ conversation: Conversation }>(
      `query Conversation($id: ID!) {
        conversation(id: $id) {
          id other { name }
          messages { id body createdAt sender { name } }
        }
      }`,
      { id },
    )
    setActive(data.conversation)
  }

  useEffect(() => {
    void loadList().catch((error: Error) => toast.error(error.message))
  }, [])

  async function start() {
    try {
      const data = await graphqlRequest<{ startConversation: Conversation }>(
        `mutation Start($username: String!) {
          startConversation(username: $username) {
            id other { name }
            messages { id body createdAt sender { name } }
          }
        }`,
        { username },
      )
      setUsername("")
      setActive(data.startConversation)
      await loadList()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start chat")
    }
  }

  async function send() {
    if (!active) {
      return
    }
    try {
      const data = await graphqlRequest<{ sendMessage: Conversation }>(
        `mutation Send($conversationId: ID!, $body: String!) {
          sendMessage(conversationId: $conversationId, body: $body) {
            id other { name }
            messages { id body createdAt sender { name } }
          }
        }`,
        { conversationId: active.id, body },
      )
      setBody("")
      setActive(data.sendMessage)
      await loadList()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send")
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
      <div className="space-y-3">
        <PageHeader title="Messages" />
        <div className="flex gap-2">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" />
          <Button onClick={() => void start()}>Chat</Button>
        </div>
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void open(item.id)}
          >
            <p className="font-medium">{item.other?.name ?? "Conversation"}</p>
            <p className="truncate text-xs text-muted-foreground">{item.lastMessage}</p>
          </button>
        ))}
      </div>
      <Card className="min-h-[28rem]">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          {active ? (
            <>
              <p className="font-medium">{active.other?.name}</p>
              <div className="flex-1 space-y-2 overflow-auto">
                {active.messages.map((message) => (
                  <div key={message.id} className="text-sm">
                    <span className="font-medium">{message.sender.name}: </span>
                    {message.body}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea rows={2} value={body} onChange={(event) => setBody(event.target.value)} />
                <Button onClick={() => void send()}>Send</Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a conversation.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
