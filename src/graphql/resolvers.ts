// import { prisma } from '@/lib/prisma';

// export const resolvers = {
//   Query: {
//     users: async () => await prisma.user.findMany(),
//   },
//   Mutation: {
//     createUser: async (_: any, args: { name: string; email: string }) =>
//       await prisma.user.create({
//         data: {
//           name: args.name,
//           email: args.email,
//         },
//       }),
//   },
// };
