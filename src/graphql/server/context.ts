import { auth } from "@/auth"
import { getLoginState } from "@/lib/rules/auth"
import type { SessionUser } from "@/lib/session"

export type YogaContext = {
  session: SessionUser | null
}

export async function createGraphQLContext(): Promise<YogaContext> {
  const session = await auth()
  const user = session?.user
  if (!user?.id || !user.username || !user.role) {
    return { session: null }
  }

  const login = await getLoginState(user.id)
  if (!login || login.disabledAt) {
    return { session: null }
  }

  return {
    session: {
      id: login.id,
      username: login.username,
      role: login.role,
      accountStatus: login.accountStatus,
    },
  }
}
