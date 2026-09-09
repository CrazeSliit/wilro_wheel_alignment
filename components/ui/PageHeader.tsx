import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function PageHeader({ title, subtitle, actionLabel, actionHref }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
