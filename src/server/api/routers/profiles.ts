import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { and, eq, sql } from "drizzle-orm";
import { type NewTemplate, type Profile, profiles, templates } from "@/server/db/schema";

const profileSchema = z.object({
  displayImage: z.string().optional(),
  name: z.string(),
  FACEBOOK_ACCESS_TOKEN: z.string(),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  FACEBOOK_BUSINESS_ID: z.string(),
});

export const profilesRouter = createTRPCRouter({
  getProfiles: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await db.query.profiles.findMany({
      where: (fields, { eq }) => eq(fields.userId, ctx.session.user.id),
      with: {
        templates: true,
      },
    });
    return profiles;
  }),
  addProfile: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      const newProfile = await db
        .insert(profiles)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();
      return newProfile;
    }),

  editProfile: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: profileSchema.partial(),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedProfile = await db
        .update(profiles)
        .set(input.data)
        .where(eq(profiles.id, input.id));
      return updatedProfile;
    }),

  deleteProfile: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await db.delete(profiles).where(and(eq(profiles.id, input.id), eq(profiles.userId, ctx.session.user.id)));
      return { success: true };
    }),
  syncProfileMessageTemplates: protectedProcedure
    .input(
      z.object({
        profileId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await db.query.profiles.findFirst({
        where: (fields, { eq }) => eq(fields.id, input.profileId),
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      const newTemplates = await getProfileTemplates(profile);

      await db.insert(templates)
        .values(newTemplates.map((template) => ({...template, createdById: ctx.session.user.id})))
        .onConflictDoUpdate({
          target: templates.id,
          set: {
            name: sql`excluded.name`,
            language: sql`excluded.language`,
            status: sql`excluded.status`,
            category: sql`excluded.category`,
            components: sql`excluded.components`,
          },
        });
    }),
});

export async function getProfileTemplates(profile: Profile) {
      const FACEBOOK_ACCESS_TOKEN = profile.FACEBOOK_ACCESS_TOKEN;
      const FACEBOOK_BUSINESS_ID = profile.FACEBOOK_BUSINESS_ID;

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${FACEBOOK_BUSINESS_ID}/message_templates?access_token=${FACEBOOK_ACCESS_TOKEN}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const { data } = (await response.json()) as TemplatesApiResponse;
      const newTemplates: Omit<NewTemplate, "createdById">[] = data
        .filter((template) => template.status === "APPROVED")
        .map((template) => ({
          id: template.id,
          profileId: profile.id,
          name: template.name,
          language: template.language,
          status: template.status,
          category: template.category,
          components: template.components,
        }));
      return newTemplates;
}

export type TemplatesApiResponse = {
  data: Datum[];
  paging: Paging;
}

interface Paging {
  cursors: Cursors;
}

interface Cursors {
  before: string;
  after: string;
}

interface Datum {
  name: string;
  components: Component[];
  language: string;
  status: string;
  category: string;
  id: string;
  sub_category?: string;
}

interface Component {
  type: string;
  format?: string;
  text?: string;
  buttons?: Button[];
}

interface Button {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
}
