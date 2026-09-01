"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials } from "@/lib/names"

type Post = {
  id: string
  body: string
  createdAt: string
  author: { name: string; username: string }
  comments: { id: string; body: string; author: { name: string } }[]
}

const FEED_QUERY = `
  query Feed {
    feed {
      id body createdAt
      author { name username }
      comments { id body author { name } }
    }
  }
`

export function FeedPanel({ basePath }: { basePath: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [body, setBody] = useState("")
  const [comment, setComment] = useState<Record<string, string>>({})

  async function load() {
    const data = await graphqlRequest<{ feed: Post[] }>(FEED_QUERY)
    setPosts(data.feed)
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [])

  async function publish() {
    try {
      await graphqlRequest(
        `mutation CreatePost($body: String!) { createPost(body: $body) { id } }`,
        { body },
      )
      setBody("")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post")
    }
  }

  async function reply(postId: string) {
    try {
      await graphqlRequest(
        `mutation AddComment($postId: ID!, $body: String!) { addComment(postId: $postId, body: $body) { id } }`,
        { postId, body: comment[postId] ?? "" },
      )
      setComment((current) => ({ ...current, [postId]: "" }))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not comment")
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Feed" description="Campus wall for posts and comments." />
      <Card>
        <CardHeader>
          <CardTitle>Share something</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} />
          <Button onClick={() => void publish()} disabled={!body.trim()}>
            Post
          </Button>
        </CardContent>
      </Card>
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar>
              <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`${basePath}/u/${post.author.username}`} className="font-medium hover:underline">
                {post.author.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm">{post.body}</p>
            <div className="space-y-2 border-t pt-3">
              {post.comments.map((item) => (
                <p key={item.id} className="text-sm">
                  <span className="font-medium">{item.author.name}: </span>
                  {item.body}
                </p>
              ))}
              <div className="flex gap-2">
                <Textarea
                  rows={1}
                  value={comment[post.id] ?? ""}
                  onChange={(event) =>
                    setComment((current) => ({ ...current, [post.id]: event.target.value }))
                  }
                  placeholder="Write a comment"
                />
                <Button variant="outline" onClick={() => void reply(post.id)}>
                  Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
