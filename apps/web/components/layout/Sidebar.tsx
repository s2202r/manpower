"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  MapPin,
  ShieldCheck,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Boxes,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const customerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Requests", href: "/dashboard/requests", icon: ClipboardList },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Sites", href: "/dashboard/sites", icon: MapPin },
  { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
];

const opsNav: NavItem[] = [
  { label: "Ops Console", href: "/ops", icon: BarChart3, exact: true },
  { label: "Workers", href: "/ops/workers", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg shadow"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-200",
          // Mobile: slide in/out. Desktop: always visible.
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          width: 232,
          background: "var(--surface-raised)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center gap-2.5 px-5 h-14 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded"
            style={{ background: "var(--accent)" }}
          >
            <Boxes size={15} className="text-white" />
          </div>
          <span
            className="font-semibold tracking-tight text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            ManPower
          </span>
          <span
            className="text-2xs font-medium px-1.5 py-0.5 rounded"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              fontSize: "0.6rem",
              letterSpacing: "0.06em",
            }}
          >
            BETA
          </span>
          {/* Close button — mobile */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden ml-auto p-1 rounded hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <p
              className="px-2 mb-1 font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}
            >
              Customer
            </p>
            <ul className="space-y-0.5">
              {customerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors",
                      isActive(item) ? "font-medium" : "hover:opacity-80"
                    )}
                    style={
                      isActive(item)
                        ? { background: "var(--accent-subtle)", color: "var(--accent)" }
                        : { color: "var(--text-secondary)" }
                    }
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p
              className="px-2 mb-1 font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}
            >
              Internal
            </p>
            <ul className="space-y-0.5">
              {opsNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors",
                      isActive(item) ? "font-medium" : "hover:opacity-80"
                    )}
                    style={
                      isActive(item)
                        ? { background: "var(--accent-subtle)", color: "var(--accent)" }
                        : { color: "var(--text-secondary)" }
                    }
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Bottom */}
        <div
          className="px-3 py-3 space-y-0.5 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <Settings size={15} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
