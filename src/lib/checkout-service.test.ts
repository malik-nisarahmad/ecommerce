import { describe, expect, it, vi } from "vitest";
import { reserveStockAtomically, type CartItemRow } from "@/lib/checkout-service";

type MockTx = {
  product: {
    updateMany: (input: unknown) => Promise<{ count: number }>;
  };
};

describe("reserveStockAtomically", () => {
  it("decrements stock for each item when enough inventory exists", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx: MockTx = { product: { updateMany } };
    const rows: CartItemRow[] = [
      {
        productId: "prod-1",
        quantity: 2,
        productName: "Tomato",
        unitPriceCents: 200,
        unit: "KG",
        stock: 10,
        lowStockThreshold: 3,
        imageUrl: null,
      },
      {
        productId: "prod-2",
        quantity: 1,
        productName: "Milk",
        unitPriceCents: 300,
        unit: "LITER",
        stock: 4,
        lowStockThreshold: 2,
        imageUrl: null,
      },
    ];

    await reserveStockAtomically(tx as never, rows);

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: "prod-1", stock: { gte: 2 } },
      data: {
        stock: { decrement: 2 },
        popularityScore: { increment: 2 },
      },
    });
  });

  it("throws when conditional decrement fails for any row", async () => {
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const tx: MockTx = { product: { updateMany } };
    const rows: CartItemRow[] = [
      {
        productId: "prod-1",
        quantity: 2,
        productName: "Tomato",
        unitPriceCents: 200,
        unit: "KG",
        stock: 10,
        lowStockThreshold: 3,
        imageUrl: null,
      },
      {
        productId: "prod-2",
        quantity: 9,
        productName: "Milk",
        unitPriceCents: 300,
        unit: "LITER",
        stock: 4,
        lowStockThreshold: 2,
        imageUrl: null,
      },
    ];

    await expect(reserveStockAtomically(tx as never, rows)).rejects.toThrow("INSUFFICIENT_STOCK");
  });
});

