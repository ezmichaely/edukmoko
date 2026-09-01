import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"

import { auth } from "@/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return Response.json({ error: "File is required." }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name) || ".bin"
  const filename = `${randomUUID()}${ext}`
  const dir = path.join(process.cwd(), "uploads")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), bytes)

  return Response.json({ url: `/api/files/${filename}` })
}
