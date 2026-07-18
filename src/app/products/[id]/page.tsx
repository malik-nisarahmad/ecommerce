import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/pricing";
import { ProductImage } from "@/components/product-image";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function LeafIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20a5 5 0 005-5V8h4z" />
      <path d="M17 8V2l-5 5" />
    </svg>
  );
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Standard Header to prevent mix-blend overlap issues */}
      <div className="relative z-50 bg-[#FAFAF5] border-b border-[#E8E8E0]">
        <SiteHeader />
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-8 md:py-12 lg:py-16 animate-fade-in-up">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-10 text-[#9CA3AF]">
          <Link href="/" className="hover:text-[#1B5E20] transition-colors">Home</Link>
          <ChevronRightIcon />
          <Link href="/#products" className="hover:text-[#1B5E20] transition-colors">Products</Link>
          <ChevronRightIcon />
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Main Image Bento */}
          <div className="lg:col-span-7 h-[50vh] md:h-[60vh] lg:h-[75vh] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden relative shadow-sm border border-[#E8E8E0] bg-[#F5F5F0] group">
            <ProductImage
              src={product.images[0]?.url}
              alt={product.images[0]?.alt ?? product.name}
              className="w-full h-full object-cover mix-blend-multiply transform scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)]"
            />
            
            {/* Overlay Badge */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
              <span className="inline-flex items-center px-4 py-2 text-xs font-black tracking-widest uppercase bg-white/80 backdrop-blur-md text-[#1B5E20] border border-white rounded-full shadow-sm">
                {product.category.name}
              </span>
            </div>
          </div>

          {/* Details & Actions Column */}
          <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
            
            {/* Title, Description & Price Bento */}
            <div className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-sm border border-[#E8E8E0] flex flex-col flex-grow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B5E20]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter text-[#1A1A1A] mb-6 relative z-10">
                {product.name}
              </h1>
              
              <p className="text-base md:text-lg text-[#78716C] font-medium leading-relaxed mb-10 relative z-10">
                {product.description}
              </p>
              
              <div className="mt-auto pt-8 border-t border-[#FAFAF5] flex items-baseline gap-3 relative z-10">
                <span className="text-4xl md:text-5xl font-black text-[#1B5E20] tracking-tighter">
                  {formatCurrency(product.priceCents)}
                </span>
                <span className="text-sm md:text-base font-bold text-[#9CA3AF] uppercase tracking-widest">
                  / {product.unit}
                </span>
              </div>
            </div>

            {/* Micro Details Row */}
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {/* Status Bento */}
              <div className="p-6 md:p-8 rounded-[2rem] border border-[#E8E8E0] bg-white flex flex-col justify-center">
                <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#9CA3AF] mb-3">Availability</p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${product.stock > 10 ? 'bg-[#16A34A]' : product.stock > 0 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'} animate-pulse`} />
                  <span className="text-base md:text-lg font-black text-[#1A1A1A]">
                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} Left` : 'Sold Out'}
                  </span>
                </div>
              </div>

              {/* Quality Bento */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-[#1B5E20] text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <LeafIcon size={80} />
                </div>
                <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/60 mb-3 relative z-10">Guarantee</p>
                <span className="text-sm md:text-base font-bold leading-tight relative z-10">
                  Farm sourced.<br/>100% Quality.
                </span>
              </div>
            </div>

            {/* Giant Add to Cart Bento */}
            <Link
              href="/cart"
              className="group relative flex items-center justify-between bg-[#1A1A1A] text-white p-4 pl-8 md:p-5 md:pl-10 rounded-full md:rounded-[3rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-[#1B5E20] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
              <span className="relative z-10 text-xl md:text-2xl font-black uppercase tracking-widest">Add to Cart</span>
              <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-[#1B5E20] transition-colors duration-500">
                <ArrowRightIcon />
              </div>
            </Link>

          </div>
        </div>
      </main>
    </div>
  );
}
