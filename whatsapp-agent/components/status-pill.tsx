import clsx from "clsx";

const TONES: Record<string, string> = {
  awaiting_payment: "bg-amber-100 text-amber-800",
  pending_payment: "bg-amber-100 text-amber-800",
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-indigo-100 text-indigo-800",
  ready: "bg-violet-100 text-violet-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
  expired: "bg-slate-200 text-slate-700",
  abandoned: "bg-slate-200 text-slate-700",
  no_show: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  human: "bg-red-100 text-red-700",
  ai: "bg-emerald-100 text-emerald-800",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={clsx("pill", TONES[status] ?? "bg-slate-100 text-slate-700")}>{label ?? status.replaceAll("_", " ")}</span>;
}
