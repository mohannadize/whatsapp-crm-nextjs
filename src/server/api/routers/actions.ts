import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { actions, type NewAction } from "@/server/db/schema";

export const actionsRouter = createTRPCRouter({
  getActions: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await db.query.actions.findMany({
        where: (fields, { eq }) => eq(fields.createdById, ctx.session.user.id),
        with: {
          contact: true,
          template: true,
        },
        limit: input.limit,
        offset: (input.page - 1) * input.limit,
      });
    }),
  sendWhatsappTemplateMessage: protectedProcedure
    .input(
      z.object({
        receipients: z.array(
          z.object({
            contactId: z.number().int().positive(),
            components: z.array(z.record(z.unknown())),
          }),
        ),
        templateId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = await db.query.templates.findFirst({
        where: (fields, { eq, and }) =>
          and(
            eq(fields.id, input.templateId),
            eq(fields.createdById, ctx.session.user.id),
          ),
      });
      if (!template) {
        throw new Error("Template not found");
      }
      const actionsToBeInserted: NewAction[] = [];
      const promises = input.receipients.map(async (receipient) => {
        const contact = await db.query.contacts.findFirst({
          where: (fields, { eq, and }) =>
            and(
              eq(fields.id, receipient.contactId),
              eq(fields.createdById, ctx.session.user.id),
            ),
        });
        if (!contact) {
          return;
        }
        const action: NewAction = {
          type: "SEND_TEMPLATE_MESSAGE",
          status: "PENDING",
          profileId: template.profileId,
          templateId: template.id,
          contactId: contact.id,
          createdById: ctx.session.user.id,
          activityLog: [],
          data: {
            components: receipient.components,
          },
        };
        actionsToBeInserted.push(action);
      });
      await Promise.all(promises);
      await db.insert(actions).values(actionsToBeInserted);
      return {
        success: true,
      };
    }),
});
