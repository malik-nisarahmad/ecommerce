"use client";

export function NewsletterForm() {
  return (
    <form
      className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Enter your email address"
        className="w-full px-5 py-3.5 text-sm rounded-full outline-none"
        style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#FFFFFF",
        }}
      />
      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 shrink-0"
        style={{
          background: "#FFFFFF",
          color: "#1B5E20",
        }}
      >
        Subscribe
      </button>
    </form>
  );
}
