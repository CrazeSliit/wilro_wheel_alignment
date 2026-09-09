import StatusBadge from "@/components/ui/StatusBadge";

export default function EmailStatusBadge({ status }: { status: "SENT" | "FAILED" | "PENDING" }) {
  if (status === "SENT") return <StatusBadge label="Email Sent" variant="green" />;
  if (status === "FAILED") return <StatusBadge label="Email Failed" variant="red" />;
  return <StatusBadge label="Pending" variant="yellow" />;
}
