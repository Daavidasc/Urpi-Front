import { AlertTriangle, TrendingDown, Info, CheckCircle2, type LucideIcon } from "lucide-react";
import type { Insight, InsightSeverity } from "@/lib/insights";

interface SeverityStyle {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  label: string;
}

export const insightConfig: Record<InsightSeverity, SeverityStyle> = {
  risk: {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Riesgo",
  },
  warning: {
    icon: TrendingDown,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Atención",
  },
  info: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    label: "Dato",
  },
  positive: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Saludable",
  },
};

export function InsightItem({ insight, compact = false }: { insight: Insight; compact?: boolean }) {
  const style = insightConfig[insight.severity];
  const Icon = style.icon;
  return (
    <div className={`flex gap-3 rounded-xl border ${style.border} bg-card/40 ${compact ? "p-3" : "p-4"} transition-colors hover:bg-card/70`}>
      <div className={`h-9 w-9 flex-shrink-0 rounded-lg ${style.bg} ${style.color} flex items-center justify-center`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground text-sm truncate">{insight.title}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
            {style.label}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{insight.description}</p>
      </div>
    </div>
  );
}
