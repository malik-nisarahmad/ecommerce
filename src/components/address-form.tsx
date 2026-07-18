"use client";

import { useState } from "react";

type Props = {
  onSuccess: (addressId: string) => void;
  onCancel: () => void;
};

export function AddressForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      label: formData.get("label"),
      recipient: formData.get("recipient"),
      phone: formData.get("phone"),
      line1: formData.get("line1"),
      line2: formData.get("line2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      countryCode: formData.get("countryCode"),
      isDefault: true,
    };

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || "Failed to create address");
        return;
      }

      onSuccess(payload.address.id);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold">Add New Delivery Address</h3>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Address Label</label>
          <input required name="label" placeholder="e.g. Home, Office" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Recipient Name</label>
          <input required name="recipient" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Phone Number</label>
          <input required name="phone" type="tel" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Address Line 1</label>
          <input required name="line1" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Address Line 2 (Optional)</label>
          <input name="line2" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">City</label>
          <input required name="city" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">State / Province</label>
          <input required name="state" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Postal Code</label>
          <input required name="postalCode" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Country Code (2 letters)</label>
          <input required name="countryCode" placeholder="US" minLength={2} maxLength={2} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm uppercase focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Address"}
        </button>
      </div>
    </form>
  );
}
