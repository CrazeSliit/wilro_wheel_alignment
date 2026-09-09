export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-4" : "h-5 w-5 border-2";

  return <span className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClass}`} aria-hidden="true" />;
}
