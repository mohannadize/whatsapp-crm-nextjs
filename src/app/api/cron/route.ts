import {
  getPendingActionsCount,
  getPendingActionBatch,
  processAction,
} from "@/server/cronJobs/processPendingActions";
import { env } from "@/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Check if the request is coming from localhost
  const requestBody = (await request.json()) as {
    password: string;
  };
  if (requestBody.password !== env.CRON_PASSWORD) {
    return new Response("Incorrect CRON password", {
      status: 403,
    });
  }

  // Create a ReadableStream to keep the connection alive
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Process pending actions
        const BATCH_SIZE = 20;
        const pendingActionsCount = await getPendingActionsCount();
        if (pendingActionsCount > 0) {
          const batches = Math.ceil(pendingActionsCount / BATCH_SIZE);
          for (let i = 0; i < batches; i++) {
            const pendingActions = await getPendingActionBatch(BATCH_SIZE, i * BATCH_SIZE);
            await Promise.all(pendingActions.map(processAction));
            
            // Send progress update
            controller.enqueue(`Processed batch ${i + 1}/${batches}\n`);
          }
        }
        controller.enqueue("All pending actions processed\n");
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  // Return a streaming response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  });
}
