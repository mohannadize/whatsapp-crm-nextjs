import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { actionsRouter } from "@/server/api/routers/actions";
import { contactsRouter } from "@/server/api/routers/contacts";
import { profilesRouter } from "@/server/api/routers/profiles";
import { accountsRouter } from "@/server/api/routers/accounts";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  actions: actionsRouter,
  contacts: contactsRouter,
  profiles: profilesRouter,
  accounts: accountsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
