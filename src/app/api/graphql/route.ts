import type { NextRequest } from "next/server"

import { handleRequest } from "@/graphql/server/yoga"

export const runtime = "nodejs"

export function GET(request: NextRequest) {
  return handleRequest(request, {})
}

export function POST(request: NextRequest) {
  return handleRequest(request, {})
}

export function OPTIONS(request: NextRequest) {
  return handleRequest(request, {})
}
