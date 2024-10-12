import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { and, eq, like, or } from "drizzle-orm";
import { contacts, profiles } from "@/server/db/schema";

const contactSchema = z.object({
  name: z.string(),
  phone: z.string(),
  country: z.string().length(2),
  address: z.string(),
  profileId: z.number().int().positive(),
});

export const contactsRouter = createTRPCRouter({
  addContact: protectedProcedure
    .input(contactSchema)
    .mutation(async ({ input, ctx }) => {
      const newContact = await db
        .insert(contacts)
        .values({ ...input, createdById: ctx.session.user.id })
        .returning();
      return newContact;
    }),
  editContact: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        ...contactSchema.partial().shape,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updatedContact = await db
        .update(contacts)
        .set(input)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.createdById, ctx.session.user.id),
          ),
        )
        .returning();
      return updatedContact;
    }),
  deleteContact: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const deletedContact = await db
        .delete(contacts)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.createdById, ctx.session.user.id),
          ),
        )
        .returning();
      return deletedContact;
    }),
  deleteAllContacts: protectedProcedure
    .input(z.object({ profileId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const deletedContacts = await db
        .delete(contacts)
        .where(
          and(
            eq(contacts.profileId, input.profileId),
            eq(contacts.createdById, ctx.session.user.id),
          ),
        )
        .returning();
      return deletedContacts;
    }),
  bulkImportContacts: protectedProcedure
    .input(
      z.object({
        profileId: z.number().int().positive(),
        contacts: z.array(contactSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { profileId, contacts: data } = input;
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, profileId), eq(profiles.userId, ctx.session.user.id)));
      if (!profile) {
        throw new Error("Profile not found");
      }
      const newContacts = await db
        .insert(contacts)
        .values(
          data.map((contact) => ({
            ...contact,
            createdById: ctx.session.user.id,
            profileId: profile.id,
          })),
        ).returning();
      return newContacts;
    }),
  getContacts: protectedProcedure
    .input(
      z.object({
        profileId: z.number().int().positive().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(40),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!input.profileId) {
        return [];
      }
      const contactsData = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.profileId, input.profileId),
            eq(contacts.createdById, ctx.session.user.id),
            input.search
              ? or(
                  like(contacts.name, `%${input.search}%`),
                  like(contacts.phone, `%${input.search}%`),
                )
              : undefined,
          ),
        )
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);
      return contactsData;
    }),
});
