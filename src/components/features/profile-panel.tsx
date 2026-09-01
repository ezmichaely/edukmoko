"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Profile = {
  name: string
  username: string
  email: string
  role: string
  bio: string | null
  firstName: string
  lastName: string
}

export function ProfilePanel({ username }: { username?: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bio, setBio] = useState("")
  const isSelf = !username

  async function load() {
    if (username) {
      const data = await graphqlRequest<{ user: Profile }>(
        `query($username: String!) { user(username: $username) { name username email role bio firstName lastName } }`,
        { username },
      )
      setProfile(data.user)
      setBio(data.user.bio ?? "")
      return
    }
    const data = await graphqlRequest<{ me: Profile }>(
      `query { me { name username email role bio firstName lastName } }`,
    )
    setProfile(data.me)
    setBio(data.me.bio ?? "")
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [username])

  async function save() {
    try {
      await graphqlRequest(`mutation($bio: String) { updateProfile(bio: $bio) { id } }`, { bio })
      toast.success("Profile updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    }
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={profile.name} description={`${profile.role} · @${profile.username}`} />
      <Card>
        <CardContent className="space-y-3 py-4">
          <Input value={profile.email} disabled />
          <Textarea value={bio} onChange={(event) => setBio(event.target.value)} disabled={!isSelf} />
          {isSelf ? <Button onClick={() => void save()}>Save bio</Button> : null}
        </CardContent>
      </Card>
    </div>
  )
}
