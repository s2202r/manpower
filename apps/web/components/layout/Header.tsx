"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Header({ title }: { title?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userInitials, setUserInitials] = useState("??");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = data.user.user_metadata?.full_name ?? data.user.email ?? "";
        const email = data.user.email ?? "";
        setUserEmail(email);
        const parts = name.split(" ").filter(Boolean);
        if (parts.length >= 2) {
          setUserInitials(parts[0][0].toUpperCase() + parts[1][0].toUpperCase());
        } else if (parts.length === 1) {
          setUserInitials(parts[0].slice(0, 2).toUpperCase());
        }
      }
    });
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 h-14"
      style={{
        background: "var(--surface-raised)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {title && (
        <h1
          className="text-sm font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded transition-colors hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Alerts bell */}
        <button
          className="p-1.5 rounded transition-colors hover:opacity-70 relative"
          style={{ color: "var(--text-muted)" }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "#EF4444" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0"
          style={{ background: "var(--accent)", color: "white" }}
          title={userEmail}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
