"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDismissed(true);
      localStorage.setItem("pwa-dismissed", "1");
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "1");
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 400,
        zIndex: 100,
        background: "#1D4ED8",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, margin: 0 }}>Add Work4.in to home screen</p>
        <p style={{ color: "#BFDBFE", fontSize: 11, margin: "2px 0 0" }}>Faster access, works offline</p>
      </div>
      <button
        onClick={handleInstall}
        style={{ background: "#fff", color: "#1D4ED8", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        style={{ background: "transparent", border: "none", color: "#93C5FD", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
