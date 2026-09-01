"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { graphqlRequest } from "@/graphql/client/request"
import { NewAssessmentForm } from "@/components/features/assessment-panel"

export default function NewAssessmentPage() {
  const params = useParams<{ role: string; code: string }>()
  const [classId, setClassId] = useState<string | null>(null)

  useEffect(() => {
    void graphqlRequest<{ classByCode: { id: string } }>(
      `query($joinCode: String!) { classByCode(joinCode: $joinCode) { id } }`,
      { joinCode: params.code },
    )
      .then((data) => setClassId(data.classByCode.id))
      .catch((error: Error) => toast.error(error.message))
  }, [params.code])

  if (!classId) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <NewAssessmentForm classId={classId} joinCode={params.code} basePath={`/${params.role}`} />
  )
}
