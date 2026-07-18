export type PriceBreakdown = {
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

const TAX_PERCENT = 8;

export function calculateTotals(subtotalCents: number): PriceBreakdown {
  const taxCents = Math.round((subtotalCents * TAX_PERCENT) / 100);
  const deliveryFeeCents = subtotalCents >= 5000 ? 0 : 399;
  const totalCents = subtotalCents + taxCents + deliveryFeeCents;
  return { subtotalCents, taxCents, deliveryFeeCents, totalCents };
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

