import { ProfilePanel } from "@/components/features/profile-panel"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return <ProfilePanel username={username} />
}
