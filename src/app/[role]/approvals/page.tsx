import { auth } from "@/auth"
import { ApprovalsPanel } from "@/components/features/approvals-panel"

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const session = await auth()
  return <ApprovalsPanel basePath={`/${role}`} role={session!.user.role} />
}
