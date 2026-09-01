import { signOut } from "@/auth"

export async function POST() {
  await signOut({ redirect: false })
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })
}
