"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";

const tabs = [
  { label: "Shifts", icon: "📋", href: "/worker/shifts" },
  { label: "Check In", icon: "📍", href: "/worker/checkin" },
  { label: "Earnings", icon: "💰", href: "/worker/earnings" },
  { label: "Profile", icon: "👤", href: "/worker/profile" },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard redirectTo="/worker/login">
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 10,
                paddingBottom: 10,
                gap: 3,
                textDecoration: "none",
                color: active ? "#1D4ED8" : "#94A3B8",
                transition: "color 0.15s",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
    </AuthGuard>
  );
}
