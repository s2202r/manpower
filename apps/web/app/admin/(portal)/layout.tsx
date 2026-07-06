"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/layout/AdminGuard";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Tag, Building2, HardHat, TrendingUp, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Tag, label: "Skills", href: "/admin/skills" },
  { icon: Building2, label: "Clients", href: "/admin/clients" },
  { icon: HardHat, label: "Workers", href: "/admin/workers" },
  { icon: TrendingUp, label: "Commissions", href: "/admin/commissions" },
  { icon: CreditCard, label: "Payment Gateway", href: "/admin/payment-gateway" },
];

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{ width: 220, background: "#0F172A", borderRight: "1px solid #1E293B" }}
    >
      {/* Logo row */}
      <div className="px-4 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid #1E293B" }}>
        <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: "#3B82F6" }}>A</div>
        <span className="font-bold text-sm text-white">Admin Console</span>
        <button
          onClick={onClose}
          className="lg:hidden ml-auto p-1 rounded hover:opacity-70 text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-md"
              style={{ color: active ? "white" : "#94A3B8", background: active ? "#1D4ED8" : "transparent" }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button onClick={signOut}
        className="flex items-center gap-3 px-6 py-4 text-sm font-medium transition-opacity hover:opacity-80 w-full text-left"
        style={{ color: "#EF4444", borderTop: "1px solid #1E293B" }}>
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: "#0F172A" }}>
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg shadow text-white"
          style={{ background: "#1E293B", border: "1px solid #334155" }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Backdrop */}
        {open && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
        )}

        <AdminSidebar open={open} onClose={() => setOpen(false)} />

        <main className="flex-1 overflow-y-auto lg:ml-[220px]" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
