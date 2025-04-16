// import { ApolloServer } from '@apollo/server';
// import { startServerAndCreateNextHandler } from '@as-integrations/next';
// import { typeDefs } from '@/graphql/schema';
// import { resolvers } from '@/graphql/resolvers';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../auth/[...nextauth]/route';

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });

// export const GET = startServerAndCreateNextHandler(server, {
//   context: async (req) => {
//     const session = await getServerSession(authOptions);
//     return { session };
//   },
// });
// export const POST = GET;
