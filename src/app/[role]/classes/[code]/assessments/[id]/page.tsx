import { auth } from "@/auth"
import { AssessmentPanel } from "@/components/features/assessment-panel"

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  return <AssessmentPanel assessmentId={id} role={session!.user.role} />
}
