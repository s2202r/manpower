"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGuard({
  children,
  redirectTo = "/auth/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace(redirectTo);
      } else {
        setChecked(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(redirectTo);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [router, redirectTo]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}
