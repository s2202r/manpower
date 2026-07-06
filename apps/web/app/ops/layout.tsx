"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/layout/AuthGuard";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard redirectTo="/auth/login">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          style={{ marginLeft: "232px" }}
        >
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
