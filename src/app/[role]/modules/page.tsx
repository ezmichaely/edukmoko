import { auth } from "@/auth"
import { ModulesPanel } from "@/components/features/modules-panel"

export default async function ModulesPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const session = await auth()
  return <ModulesPanel basePath={`/${role}`} role={session!.user.role} />
}
