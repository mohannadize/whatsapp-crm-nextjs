import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { actions, type NewAction } from "@/server/db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";

export const actionsRouter = createTRPCRouter({
  getActionsSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = {
        totalActions: 0,
        totalSuccess: 0,
        totalPending: 0,
        totalFailed: 0,
      };
      const endDate = new Date(input.endDate);
      endDate.setDate(endDate.getDate() + 1);
      const actionsData = await db
        .select({
          status: actions.status,
          count: sql<number>`count(${actions.id})`,
        })
        .from(actions)
        .where(
          and(
            eq(actions.createdById, ctx.session.user.id),
            gte(actions.createdAt, new Date(input.startDate)),
            lt(actions.createdAt, endDate),
          ),
        )
        .groupBy(actions.status);
      actionsData.forEach((action) => {
        data[
          `total${action.status[0] + action.status.slice(1).toLowerCase()}` as keyof typeof data
        ] = action.count;
      });
      return data;
    }),
  getActions: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, startDate, endDate } = input;
      const offset = (page - 1) * limit;
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

      const [actionsResult, totalCount] = await Promise.all([
        db.query.actions.findMany({
          limit,
          offset,
          orderBy: (actions, { desc }) => [desc(actions.createdAt)],
          with: {
            contact: true,
            template: true,
            profile: true,
          },
          where: (actions, { and, gte, lt }) => 
            and(
              eq(actions.createdById, ctx.session.user.id),
              gte(actions.createdAt, new Date(startDate)),
              lt(actions.createdAt, endDatePlusOne)
            ),
        }),
        db
          .select({ count: sql<number>`count(${actions.id})` })
          .from(actions)
          .where(
            and(
              eq(actions.createdById, ctx.session.user.id),
              gte(actions.createdAt, new Date(startDate)),
              lt(actions.createdAt, endDatePlusOne)
            )
          ),
      ]);

      return {
        actions: actionsResult,
        totalPages: Math.ceil(Number(totalCount[0]?.count ?? 0) / limit),
      };
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
      const batchSize = 500;
      for (let i = 0; i < actionsToBeInserted.length; i += batchSize) {
        const batch = actionsToBeInserted.slice(i, i + batchSize);
        await db.insert(actions).values(batch);
      }
      return {
        success: true,
      };
    }),
});
