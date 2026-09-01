import { readFile } from "node:fs/promises"
import path from "node:path"

import { auth } from "@/auth"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const session = await auth()
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { path: segments } = await context.params
  const filename = segments.join("/")
  if (filename.includes("..") || filename.includes("/")) {
    return new Response("Invalid path", { status: 400 })
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), "uploads", filename))
    return new Response(bytes)
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
