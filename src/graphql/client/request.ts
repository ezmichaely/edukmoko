export class GraphqlRequestError extends Error {
  readonly code: string | null

  constructor(message: string, code: string | null) {
    super(message)
    this.name = "GraphqlRequestError"
    this.code = code
  }
}

type GraphqlResponse<T> = {
  data?: T | null
  errors?: { message: string; extensions?: { code?: string } }[]
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new GraphqlRequestError("Request failed.", "UNAVAILABLE")
  }

  const payload = (await response.json()) as GraphqlResponse<T>
  const firstError = payload.errors?.[0]
  if (firstError) {
    throw new GraphqlRequestError(
      firstError.message,
      firstError.extensions?.code ?? null,
    )
  }
  if (payload.data == null) {
    throw new GraphqlRequestError("No data returned.", null)
  }
  return payload.data
}
