"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UserRow = {
  id: string
  name: string
  username: string
  role: string
  accountStatus: string
  email: string
}

export function UsersPanel({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([])

  async function load() {
    const data = await graphqlRequest<{ users: UserRow[] }>(
      pendingOnly
        ? `query { users(accountStatus: PENDING) { id name username role accountStatus email } }`
        : `query { users { id name username role accountStatus email } }`,
    )
    setUsers(data.users)
  }

  useEffect(() => {
    void load().catch((error: Error) => toast.error(error.message))
  }, [pendingOnly])

  async function setStatus(userId: string, accountStatus: "APPROVED" | "REJECTED") {
    try {
      await graphqlRequest(
        `mutation($userId: ID!, $accountStatus: AccountStatus!) {
          setAccountStatus(userId: $userId, accountStatus: $accountStatus) { id }
        }`,
        { userId, accountStatus },
      )
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pendingOnly ? "Account requests" : "People"}
        description={pendingOnly ? "Approve or reject new registrations." : "Directory of campus accounts."}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge variant="outline">{user.accountStatus}</Badge>
              </TableCell>
              <TableCell className="space-x-2">
                {user.accountStatus !== "APPROVED" ? (
                  <Button size="sm" onClick={() => void setStatus(user.id, "APPROVED")}>
                    Approve
                  </Button>
                ) : null}
                {user.accountStatus !== "REJECTED" ? (
                  <Button size="sm" variant="outline" onClick={() => void setStatus(user.id, "REJECTED")}>
                    Reject
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
