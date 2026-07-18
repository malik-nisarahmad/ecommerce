import { requireAdminUser } from "@/lib/auth";
import { subscribeRealtimeEvent } from "@/lib/realtime";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminUser();
  } catch {
    return jsonError("Forbidden", 403);
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      send({ type: "connected", at: new Date().toISOString() });

      const unsubscribe = subscribeRealtimeEvent((event) => {
        send(event);
      });

      const heartbeat = setInterval(() => {
        send({ type: "heartbeat", at: new Date().toISOString() });
      }, 15_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

