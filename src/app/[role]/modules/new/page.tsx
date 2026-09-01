import { auth } from "@/auth"
import { ModuleEditor } from "@/components/features/module-editor"

export default async function NewModulePage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const session = await auth()
  return (
    <ModuleEditor
      basePath={`/${role}`}
      role={session!.user.role}
      username={session!.user.username}
    />
  )
}
