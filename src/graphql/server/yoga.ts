import { createSchema, createYoga } from "graphql-yoga"

import { createGraphQLContext } from "@/graphql/server/context"
import { resolvers, typeDefs } from "@/graphql/server/schema"

const schema = createSchema({
  typeDefs,
  resolvers,
})

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  fetchAPI: { Response },
  context: () => createGraphQLContext(),
  maskedErrors: process.env.NODE_ENV === "production",
})

export const { handleRequest } = yoga
