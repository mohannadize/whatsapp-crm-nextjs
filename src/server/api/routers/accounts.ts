import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { users, type NewUser } from "@/server/db/schema";
import { eq, or } from "drizzle-orm";

export const accountsRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string(),
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user: NewUser = {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        password: input.password,
      };
      const [check] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, user.email ?? ""),
            eq(users.username, user.username ?? ""),
          ),
        );
      if (check) {
        throw new Error("User already exists");
      }
      await db.insert(users).values(user);
    }),
});
