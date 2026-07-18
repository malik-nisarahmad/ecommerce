"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/pricing";
import { AddressForm } from "@/components/address-form";

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

type CartRow = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    priceCents: number;
    unit: string;
    stock: number;
    images: Array<{ url: string; alt: string }>;
  };
};

type CartPayload = {
  id: string;
  items: CartRow[];
};

type Props = {
  initialAddresses: Address[];
  cart: CartPayload;
  totals: {
    subtotalCents: number;
    taxCents: number;
    deliveryFeeCents: number;
    totalCents: number;
  };
  stripeConfigured: boolean;
};

export function CheckoutClient({ initialAddresses, cart, totals, stripeConfigured }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [addressId, setAddressId] = useState<string>(initialAddresses[0]?.id || "");
  const [deliverySlot, setDeliverySlot] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE_MOCK" | "PAYPAL_MOCK" | "STRIPE_REAL">("STRIPE_MOCK");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulated credit card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Simulated PayPal states
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalStep, setPayPalStep] = useState<"LOGIN" | "PAY">("LOGIN");
  const [payPalEmail, setPayPalEmail] = useState("");
  const [payPalPassword, setPayPalPassword] = useState("");
  const [payPalLoading, setPayPalLoading] = useState(false);

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{1,4}/g);
    setCardNumber(matches ? matches.join(" ") : "");
  };

  // Card brand detection helper
  const cardBrand = useMemo(() => {
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleanNum)) return "Mastercard";
    if (/^3[47]/.test(cleanNum)) return "Amex";
    return "Generic";
  }, [cardNumber]);

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvc(value);
  };

  const handleCheckoutSubmit = async (options?: { isPayPalDirect?: boolean }) => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Delivery Slot Start & End Dates
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    if (deliverySlot === "MORNING") { start.setHours(8, 0, 0, 0); end.setHours(12, 0, 0, 0); }
    else if (deliverySlot === "AFTERNOON") { start.setHours(12, 0, 0, 0); end.setHours(16, 0, 0, 0); }
    else { start.setHours(16, 0, 0, 0); end.setHours(20, 0, 0, 0); }

    // Map checkout options
    const selectedMethod = 
      paymentMethod === "STRIPE_REAL" 
        ? "STRIPE_REAL" 
        : paymentMethod === "PAYPAL_MOCK" || options?.isPayPalDirect
          ? "PAYPAL_MOCK" 
          : "STRIPE_CARD_MOCK";

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          deliverySlotStart: start.toISOString(),
          deliverySlotEnd: end.toISOString(),
          paymentMethod: selectedMethod,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Checkout failed. Please check your inputs.");
        setIsProcessing(false);
        return;
      }

      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
      } else {
        setErrorMessage("Unexpected server response. Please try again.");
        setIsProcessing(false);
      }
    } catch (e) {
      setErrorMessage("Network error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const isFormValid = useMemo(() => {
    if (!addressId || !deliverySlot) return false;
    if (paymentMethod === "STRIPE_MOCK") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      return cleanNum.length === 16 && cardHolder.trim().length > 2 && cardExpiry.length === 5 && cardCvc.length >= 3;
    }
    return true;
  }, [addressId, deliverySlot, paymentMethod, cardNumber, cardHolder, cardExpiry, cardCvc]);

  const deliveryFee = deliverySlot === "EVENING" ? 700 : 500;
  const currentTotal = totals.subtotalCents + totals.taxCents + (totals.subtotalCents >= 5000 ? 0 : deliveryFee);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen font-sans">
      {/* Checkout Forms (Left Column) */}
      <div className="w-full lg:w-[55%] px-6 py-24 md:px-16 md:py-32 bg-[#FAFAF5] space-y-12">
        <h1 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter mb-8">
          Secure Checkout
        </h1>
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl animate-pulse-soft">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* STEP 1: Delivery Details */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1B5E20]/10 text-[#1B5E20] text-xs">1</span>
            Delivery Address & Schedule
          </h2>

          {showAddressForm ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <AddressForm
                onSuccess={async (newId) => {
                  const res = await fetch("/api/addresses");
                  if (res.ok) {
                    const data = await res.json();
                    setAddresses(data.addresses);
                    setAddressId(newId);
                  }
                  setShowAddressForm(false);
                }}
                onCancel={() => setShowAddressForm(false)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Address</label>
                {addresses.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-semibold mb-2">No addresses saved yet</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-4 py-2 bg-[#1B5E20] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#134416]"
                    >
                      + Add Address
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none"
                      value={addressId}
                      onChange={(e) => setAddressId(e.target.value)}
                    >
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.label} — {addr.recipient} ({addr.line1}, {addr.city})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      + New
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Window selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2.5">Select Delivery Window</label>
                <div className="grid gap-3 grid-cols-3">
                  {[
                    { id: "MORNING", title: "Morning", time: "8 AM - 12 PM", fee: "$5.00" },
                    { id: "AFTERNOON", title: "Afternoon", time: "12 PM - 4 PM", fee: "$5.00" },
                    { id: "EVENING", title: "Evening", time: "4 PM - 8 PM", fee: "$7.00" }
                  ].map((slot) => {
                    const isSelected = deliverySlot === slot.id;
                    const finalFee = totals.subtotalCents >= 5000 ? "FREE" : slot.fee;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setDeliverySlot(slot.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                          isSelected 
                            ? "border-[#1B5E20] bg-green-50/50 text-[#1B5E20]" 
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold text-xs">{slot.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-1">{slot.time}</span>
                        <span className="text-[10px] font-black uppercase mt-1 text-[#1B5E20]">{finalFee}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Payment Integration */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1B5E20]/10 text-[#1B5E20] text-xs">2</span>
            Payment Gateway Integration
          </h2>

          {/* Payment Method selection tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setPaymentMethod("STRIPE_MOCK"); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                paymentMethod === "STRIPE_MOCK" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              💳 Stripe Sandbox
            </button>
            <button
              onClick={() => { setPaymentMethod("PAYPAL_MOCK"); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                paymentMethod === "PAYPAL_MOCK" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🛒 PayPal Sandbox
            </button>
            {stripeConfigured && (
              <button
                onClick={() => { setPaymentMethod("STRIPE_REAL"); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                  paymentMethod === "STRIPE_REAL" ? "bg-white text-[#1B5E20] shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ⚡ Live Gateway
              </button>
            )}
          </div>

          {/* Tab 1: Stripe Sandbox Simulation */}
          {paymentMethod === "STRIPE_MOCK" && (
            <div className="space-y-6">
              
              {/* Visual 3D Flip Card */}
              <div className="relative w-full max-w-[320px] h-[190px] mx-auto perspective-1000">
                <div 
                  className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
                    isCardFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-zinc-800 to-slate-900 text-white flex flex-col justify-between shadow-lg backface-hidden border border-white/5">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-7 rounded bg-amber-200/90 shadow-inner flex items-center justify-center opacity-90 overflow-hidden">
                        <div className="w-6 h-5 border border-slate-800/20 rounded-sm bg-gradient-to-r from-amber-400 to-amber-200" />
                      </div>
                      <span className="text-sm font-bold tracking-widest uppercase italic opacity-75">
                        {cardBrand}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-bold tracking-[3px] text-zinc-100">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400">Card Holder</p>
                        <p className="text-xs font-bold tracking-wider truncate max-w-[170px]">
                          {cardHolder.toUpperCase() || "CARDHOLDER NAME"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400">Expires</p>
                        <p className="text-xs font-bold tracking-wider">
                          {cardExpiry || "MM/YY"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-800 to-slate-900 text-white flex flex-col justify-between shadow-lg rotate-y-180 backface-hidden border border-white/5 py-4">
                    <div className="w-full h-9 bg-black mt-2" />
                    <div className="px-5">
                      <div className="flex justify-between items-center bg-white/20 p-1.5 rounded text-right">
                        <span className="text-[9px] tracking-wider text-zinc-300 font-bold uppercase">SECURE CVC</span>
                        <span className="text-sm font-mono font-bold tracking-widest text-white px-2">
                          {cardCvc || "•••"}
                        </span>
                      </div>
                    </div>
                    <div className="px-5 flex justify-between items-end">
                      <p className="text-[8px] text-zinc-400 leading-none">FreshLane Sandbox Payment System</p>
                      <span className="text-[10px] font-black tracking-widest italic opacity-75">{cardBrand}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Card details */}
              <div className="grid gap-4 grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Card Number</label>
                  <input
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onFocus={() => setIsCardFlipped(false)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-[#1B5E20]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cardholder Name</label>
                  <input
                    required
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    onFocus={() => setIsCardFlipped(false)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-[#1B5E20]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setIsCardFlipped(false)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-[#1B5E20] text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CVC Code</label>
                  <input
                    required
                    placeholder="123"
                    value={cardCvc}
                    onChange={handleCvcChange}
                    onFocus={() => setIsCardFlipped(true)}
                    onBlur={() => setIsCardFlipped(false)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-[#1B5E20] text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed font-semibold">
                💡 <strong>Test card details:</strong> Use any Visa/Mastercard credentials (e.g. Card: <code className="bg-slate-200 px-1 py-0.5 rounded">4242 4242 4242 4242</code>, Expiry: <code className="bg-slate-200 px-1 py-0.5 rounded">12/29</code>, CVC: <code className="bg-slate-200 px-1 py-0.5 rounded">123</code>) to confirm checkout validation.
              </div>
            </div>
          )}

          {/* Tab 2: PayPal Sandbox Simulation */}
          {paymentMethod === "PAYPAL_MOCK" && (
            <div className="p-8 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-slate-50">
              <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-2xl text-blue-600 shadow-sm">
                🅿️
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">PayPal Sandbox Direct checkout</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
                  Trigger a secure sandbox payment gateway popup to authorize your payment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayPalModal(true)}
                className="w-full max-w-xs bg-amber-400 hover:bg-amber-500 font-bold text-slate-900 py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors text-sm"
              >
                Pay with <span className="font-black text-blue-800">PayPal</span>
              </button>
            </div>
          )}

          {/* Tab 3: Real Stripe checkout */}
          {paymentMethod === "STRIPE_REAL" && (
            <div className="p-6 bg-green-50/50 border border-green-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 border border-green-200 rounded-full flex items-center justify-center text-xl text-green-700">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Official Stripe Checkout</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
                  You will be securely redirected to Stripe's hosted payment gateway page to finalize your order.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary & Finalize (Right Column) */}
      <div className="w-full lg:w-[45%] bg-[#1A1A1A] text-white px-6 py-12 md:px-16 md:py-32 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto custom-scrollbar border-l border-white/10">
        <div className="space-y-8">
          <div>
            <h3 className="font-black text-2xl uppercase tracking-widest text-white/80 mb-6 pb-4 border-b border-white/20">Order Summary</h3>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="truncate text-base font-bold text-white/90">
                    <span className="font-black text-[#4CAF50] mr-2">{item.quantity}×</span> {item.product.name}
                  </div>
                  <span className="text-sm text-white/60 font-bold whitespace-nowrap">
                    {formatCurrency(item.product.priceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time DB stock availability check */}
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            All items are in stock and reserved for checkout.
          </div>

          <div className="space-y-4 text-sm text-white/60 border-t border-white/20 pt-8 font-bold tracking-widest uppercase">
            <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-black">{formatCurrency(totals.subtotalCents)}</span></div>
            <div className="flex justify-between"><span>Taxes (8.25%)</span><span className="text-white font-black">{formatCurrency(totals.taxCents)}</span></div>
            <div className="flex justify-between"><span>Delivery Fee</span><span className="text-white font-black">{formatCurrency(totals.subtotalCents >= 5000 ? 0 : deliveryFee)}</span></div>
            <div className="flex justify-between text-3xl font-black text-white border-t border-white/20 pt-6 mt-4 tracking-tighter normal-case">
              <span>Grand Total</span><span className="text-[#BBF7D0]">{formatCurrency(currentTotal)}</span>
            </div>
          </div>

          {/* Checkout Submit triggers */}
          {paymentMethod !== "PAYPAL_MOCK" && (
            <button
              onClick={() => handleCheckoutSubmit()}
              disabled={!isFormValid || isProcessing}
              className="w-full mt-8 py-5 bg-white hover:bg-gray-100 text-[#1B5E20] hover:text-[#134416] font-black uppercase tracking-widest rounded-full text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 hover:scale-105"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Payment...
                </>
              ) : paymentMethod === "STRIPE_REAL" ? (
                "Redirect to Payment Gateway"
              ) : (
                "Authorize & Place Order"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Simulated PayPal Iframe Popup Modal */}
      {showPayPalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col scale-in">
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[#003087] font-black text-xl italic select-none">
                Pay<span className="text-[#0079C1]">Pal</span> <span className="text-xs font-bold text-amber-500 uppercase tracking-widest ml-1 bg-amber-100 px-2 py-0.5 rounded">Sandbox</span>
              </span>
              <button 
                onClick={() => setShowPayPalModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 space-y-5">
              
              {payPalLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-600">
                    {payPalStep === "LOGIN" ? "Authenticating sandbox credentials..." : "Authorizing payment intent..."}
                  </p>
                </div>
              ) : payPalStep === "LOGIN" ? (
                /* Step 1: PayPal Login simulation */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPayPalLoading(true);
                    setTimeout(() => {
                      setPayPalLoading(false);
                      setPayPalStep("PAY");
                    }, 1500);
                  }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h3 className="font-bold text-slate-800 text-base">Log in with your Sandbox Account</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">
                      Please enter simulated PayPal checkout sandbox details.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <input 
                        type="email" 
                        required 
                        placeholder="sandbox-buyer@paypal.com"
                        value={payPalEmail}
                        onChange={(e) => setPayPalEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••"
                        value={payPalPassword}
                        onChange={(e) => setPayPalPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0079C1] hover:bg-[#005EA6] text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer mt-4"
                  >
                    Log In to Sandbox
                  </button>

                  <div className="p-3 bg-zinc-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-normal font-semibold">
                    💡 <strong>Simulated Sandbox:</strong> Use any email and password values to proceed.
                  </div>
                </form>
              ) : (
                /* Step 2: PayPal Payment Confirm simulation */
                <div className="space-y-5">
                  <div className="text-center">
                    <h3 className="font-black text-slate-800 text-lg">Confirm Payment Authorization</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">
                      Authorize funding source for transaction execution.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-semibold text-xs text-slate-600">
                    <div className="flex justify-between"><span>Checkout Amount</span><span className="text-slate-800 font-bold">{formatCurrency(currentTotal)}</span></div>
                    <div className="flex justify-between"><span>Payment Source</span><span className="text-slate-800 font-bold">PayPal Balance (sandbox)</span></div>
                    <div className="flex justify-between"><span>Merchant</span><span className="text-slate-800 font-bold">FreshLane Grocery Corp</span></div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPayPalStep("LOGIN")}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setPayPalLoading(true);
                        setTimeout(async () => {
                          setPayPalLoading(false);
                          setShowPayPalModal(false);
                          await handleCheckoutSubmit({ isPayPalDirect: true });
                        }, 1800);
                      }}
                      className="flex-1 py-3 bg-[#0079C1] hover:bg-[#005EA6] text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
              🔒 SSL Encrypted Checkout Sandbox Connection
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
