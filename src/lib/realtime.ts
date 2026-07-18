import { EventEmitter } from "events";
import type { OrderStatus } from "@/lib/db";

type RealtimeEvent =
  | {
      type: "order.created";
      orderId: string;
      totalCents: number;
      itemCount: number;
      createdAt: string;
    }
  | {
      type: "order.status.updated";
      orderId: string;
      status: OrderStatus;
      updatedAt: string;
    }
  | {
      type: "stock.updated";
      productId: string;
      stock: number;
      lowStockThreshold: number;
      updatedAt: string;
    }
  | {
      type: "stock.low";
      productId: string;
      stock: number;
      lowStockThreshold: number;
      productName: string;
      updatedAt: string;
    };

const globalEventBus = globalThis as unknown as {
  realtimeBus?: EventEmitter;
};

const bus = globalEventBus.realtimeBus ?? new EventEmitter();
bus.setMaxListeners(1000);
if (!globalEventBus.realtimeBus) {
  globalEventBus.realtimeBus = bus;
}

export function publishRealtimeEvent(event: RealtimeEvent): void {
  bus.emit("event", event);
}

export function subscribeRealtimeEvent(listener: (event: RealtimeEvent) => void): () => void {
  bus.on("event", listener);
  return () => bus.off("event", listener);
}

export type { RealtimeEvent };

