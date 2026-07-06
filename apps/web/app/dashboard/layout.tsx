import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ marginLeft: "232px" }}
      >
        {children}
      </div>
    </div>
  );
}
