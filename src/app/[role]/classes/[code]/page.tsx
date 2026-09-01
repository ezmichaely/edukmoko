import { auth } from "@/auth"
import { ClassDetailPanel } from "@/components/features/class-detail-panel"

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ role: string; code: string }>
}) {
  const { role, code } = await params
  const session = await auth()
  return <ClassDetailPanel basePath={`/${role}`} joinCode={code} role={session!.user.role} />
}
