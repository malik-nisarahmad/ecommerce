import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#0D3B13] py-16 px-6 md:px-12 text-[#FAFAF5] relative overflow-hidden mt-auto z-10">
      {/* Background glow for dark panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-center text-[15vw] md:text-[12vw] font-black leading-[0.85] tracking-tighter text-white/95 hover:text-white transition-colors cursor-pointer drop-shadow-lg">
          <Link href="/">freshlane.com</Link>
        </h1>
        
        {/* Newsletter form integrated in the sliding panel */}
        <div className="mt-16 max-w-xl mx-auto text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">Subscribe to Fresh Updates</h2>
          <p className="text-xs md:text-sm text-white/70 max-w-md mx-auto">
            Get weekly organic deals, seasonal harvest alerts, and exclusive coupon codes.
          </p>
          <div className="pt-2">
            <NewsletterForm />
          </div>
        </div>

        {/* Informational grid details at the very bottom */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10 text-xs md:text-sm font-bold uppercase tracking-wider text-white/60">
          <div>
            <p className="text-white mb-2">Our Harvest</p>
            <p className="font-medium text-white/40 normal-case leading-relaxed">
              100% certified organic<br />
              hand-selected daily
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Delivery Service</p>
            <p className="font-medium text-white/40 normal-case leading-relaxed">
              Order before 2 PM<br />
              get it same-day
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Free Delivery</p>
            <p className="font-medium text-white/40 normal-case leading-relaxed">
              All transactions over $50<br />
              include free delivery slots
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Support</p>
            <p className="font-medium text-white/40 normal-case leading-relaxed">
              Reach support at any time<br />
              support@freshlane.com
            </p>
          </div>
        </div>

        {/* Standard Footer Bottom */}
        <div className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs border-t border-white/10 text-white/40 font-medium">
          <p>© {new Date().getFullYear()} FreshLane Grocers. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors duration-200 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors duration-200 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
