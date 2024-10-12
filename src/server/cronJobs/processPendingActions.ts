import { db } from "@/server/db";
import { actions } from "../db/schema";
import { count as countFn, eq, ne } from "drizzle-orm";

export async function getPendingActionsCount() {
  const [row] = await db.select({ count: countFn() }).from(actions).where(ne(actions.status, "SUCCESS"));
  return row?.count ?? 0;
}

export function getPendingActionBatch(batchSize: number, offset: number) {
  return db.query.actions.findMany({
    where: (fields, { ne }) => ne(fields.status, "SUCCESS"),
    limit: batchSize,
    offset: offset,
    with: {
      contact: true,
      profile: true,
      template: true,
    },
  });
}

type ActionsToBeProcessed = Awaited<ReturnType<typeof getPendingActionBatch>>;

export async function processAction(action: ActionsToBeProcessed[number]) {
  try {
    // Calling the appropriate function based on the action type
    switch (action.type) {
      case "SEND_TEMPLATE_MESSAGE":
        await sendTemplateMessage(action);
    }

    // Updating the action status to SUCCESS
    action.status = "SUCCESS";
    action.activityLog.push({
      timestamp: Date.now(),
      status: "SUCCESS",
      message: `Message sent to ${action.contact.phone}`,
    });
  } catch (error: unknown) {
    // Handling the error
    // Updating the action status to FAILED
    action.status = "FAILED";
    action.activityLog.push({
      timestamp: Date.now(),
      status: "FAILED",
      message: `Failed to send message to ${action.contact.phone}: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error,
    });
  }

  // Updating the action in the database
  const updatedAction = await db.update(actions).set({ status: action.status, activityLog: action.activityLog }).where(eq(actions.id, action.id)).returning();
  return updatedAction[0];
}

async function sendTemplateMessage(action: ActionsToBeProcessed[number]) {
  const { FACEBOOK_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = action.profile;

  if (!FACEBOOK_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "Missing Facebook access token or WhatsApp phone number ID",
    );
  }

  const { phone } = action.contact;
  const { components } = action.data;
  const template = action.template;
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FACEBOOK_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "template",
          template: {
            name: template!.name,
            language: { code: template!.language },
            components: components || [],
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = (await response.json()) as {
        error: { message: string };
      };
      throw new Error(errorData.error.message);
    }
  } catch (error: unknown) {
    throw new Error(
      `Failed to send message to ${phone}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
