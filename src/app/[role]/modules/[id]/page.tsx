import { auth } from "@/auth"
import { ModuleEditor } from "@/components/features/module-editor"

export default async function ModulePage({
  params,
}: {
  params: Promise<{ role: string; id: string }>
}) {
  const { role, id } = await params
  const session = await auth()
  return (
    <ModuleEditor
      basePath={`/${role}`}
      moduleId={id}
      role={session!.user.role}
      username={session!.user.username}
    />
  )
}
