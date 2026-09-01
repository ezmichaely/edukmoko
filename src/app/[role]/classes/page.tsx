import { auth } from "@/auth"
import { ClassesPanel } from "@/components/features/classes-panel"

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const session = await auth()
  return <ClassesPanel basePath={`/${role}`} role={session!.user.role} />
}
