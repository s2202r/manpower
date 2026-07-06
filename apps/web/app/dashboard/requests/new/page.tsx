import { Header } from "@/components/layout/Header";
import { RequestForm } from "@/components/requests/RequestForm";

export default function NewRequestPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="New Staffing Request" />
      <div className="px-6 py-5">
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Fill in the details below to place a new staffing request. Our ops
          team will confirm allocation within 2 hours.
        </p>
        <RequestForm />
      </div>
    </div>
  );
}
