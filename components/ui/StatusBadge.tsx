type Variant = "green" | "red" | "yellow" | "blue" | "gray";

const variantClasses: Record<Variant, string> = {
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  yellow: "bg-amber-100 text-amber-700",
  blue: "bg-sky-100 text-sky-700",
  gray: "bg-slate-100 text-slate-700",
};

export default function StatusBadge({ label, variant }: { label: string; variant: Variant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
