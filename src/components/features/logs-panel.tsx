"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { PageHeader } from "@/components/shell/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Log = { id: string; action: string; createdAt: string; user: { name: string } | null }

export function LogsPanel() {
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    void graphqlRequest<{ auditLogs: Log[] }>(
      `query { auditLogs { id action createdAt user { name } } }`,
    )
      .then((data) => setLogs(data.auditLogs))
      .catch((error: Error) => toast.error(error.message))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="System logs" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              <TableCell>{log.user?.name ?? "System"}</TableCell>
              <TableCell>{log.action}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
