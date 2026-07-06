"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 flex flex-col z-40"
      style={{
        width: "232px",
        background: "var(--surface-raised)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
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
          className="ml-auto text-2xs font-medium px-1.5 py-0.5 rounded"
          style={{
            background: "var(--accent-subtle)",
            color: "var(--accent)",
            fontSize: "0.6rem",
            letterSpacing: "0.06em",
          }}
        >
          BETA
        </span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Customer section */}
        <div>
          <p
            className="px-2 mb-1 text-2xs font-semibold uppercase tracking-widest"
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
                    isActive(item)
                      ? "font-medium"
                      : "hover:opacity-80"
                  )}
                  style={
                    isActive(item)
                      ? {
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }
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

        {/* Ops section */}
        <div>
          <p
            className="px-2 mb-1 text-2xs font-semibold uppercase tracking-widest"
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
                      ? {
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }
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

      {/* Bottom actions */}
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
  );
}
