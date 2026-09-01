import { PDFDocument, StandardFonts } from "pdf-lib"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await context.params
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      subject: true,
      author: true,
      outlines: { orderBy: { order: "asc" } },
    },
  })
  if (!module) {
    return new Response("Not found", { status: 404 })
  }

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  let page = pdf.addPage([612, 792])
  let y = 750
  const write = (text: string, size = 12) => {
    const lines = text.split("\n")
    for (const line of lines) {
      if (y < 60) {
        page = pdf.addPage([612, 792])
        y = 750
      }
      page.drawText(line.slice(0, 90), { x: 48, y, size, font })
      y -= size + 6
    }
  }

  write(`${module.subject.code} — ${module.title}`, 18)
  write(`Author: ${module.author.firstName} ${module.author.lastName}`)
  write("")
  write("Introduction", 14)
  write(module.intro)
  write("")
  write("Outcomes", 14)
  write(module.outcomes)
  for (const outline of module.outlines) {
    write("")
    write(outline.title, 14)
    write(outline.content)
  }

  const bytes = await pdf.save()
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${module.subject.code}-module.pdf"`,
    },
  })
}
