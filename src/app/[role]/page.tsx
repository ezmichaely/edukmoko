import { FeedPanel } from "@/components/features/feed-panel"

export default async function RoleHomePage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  return <FeedPanel basePath={`/${role}`} />
}
