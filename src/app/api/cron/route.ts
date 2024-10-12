import { getPendingActionsCount, getPendingActionBatch, processAction } from "@/server/cronJobs/processPendingActions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Check if the request is coming from localhost
  const requestHost = request.headers.get("host");
  if (!requestHost || !["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(requestHost?.split(":")[0] ?? "")) {
    return new Response("Forbidden: Only localhost requests are allowed", { status: 403 });
  }

  // Process pending actions
  const BATCH_SIZE = 20;
  const pendingActionsCount = await getPendingActionsCount();
  if (pendingActionsCount > 0) {
    const batches = Math.ceil(pendingActionsCount / BATCH_SIZE);
    for (let i = 0; i < batches; i += BATCH_SIZE) {
      const pendingActions = await getPendingActionBatch(BATCH_SIZE, i);
      await Promise.all(pendingActions.map(processAction));
    }
  }
  return new Response("OK");
}
