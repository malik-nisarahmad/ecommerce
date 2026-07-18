import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminHeader } from "@/components/admin-header";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen selection:bg-[#4CAF50]/30 selection:text-slate-900 bg-[#FAFAF5]">
      {/* Background soft glowing orbs for light theme depth */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4CAF50]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#FF6F00]/5 blur-[150px]" />
      </div>

      <AdminHeader userName={user.name} />
      
      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B5E20] to-[#4CAF50]">Overview</span>
            </h1>
            <p className="mt-2 text-sm max-w-xl leading-relaxed text-slate-600 font-medium">
              Manage your entire store operations, inventory, and order fulfillment from this centralized control panel.
            </p>
          </div>
        </div>
        
        <AdminDashboard />
      </main>
    </div>
  );
}
