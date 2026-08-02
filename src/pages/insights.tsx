import {
  useGetDashboardStats,
  useGetMovementHistory,
  useListProducts,
  useGetCategoryBreakdown,
  useGetProductVelocity,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import { buildInsights } from "@/lib/insights";
import { InsightItem, insightConfig } from "@/components/insights-ui";
import type { InsightSeverity } from "@/lib/insights";

export function Insights() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: history } = useGetMovementHistory({ days: 7 });
  const { data: lowStock } = useListProducts({ lowStock: true });
  const { data: products } = useListProducts();
  const { data: categories } = useGetCategoryBreakdown();
  const { data: velocity } = useGetProductVelocity();

  const insights = useMemo(
    () => buildInsights({ stats, categories, products, lowStock, history, velocity }),
    [stats, categories, products, lowStock, history, velocity],
  );

  const counts = useMemo(() => {
    const acc: Record<InsightSeverity, number> = { risk: 0, warning: 0, info: 0, positive: 0 };
    insights.forEach((i) => (acc[i.severity] += 1));
    return acc;
  }, [insights]);

  const summaryCards: { severity: InsightSeverity; label: string }[] = [
    { severity: "risk", label: "Riesgos" },
    { severity: "warning", label: "Atención" },
    { severity: "info", label: "Datos" },
    { severity: "positive", label: "Saludable" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground text-[13px] mt-0.5">
            Recomendaciones generales generadas a partir de tu inventario
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-lg h-9 text-sm bg-card"
          onClick={() => queryClient.invalidateQueries()}
        >
          <RefreshCcw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ severity, label }) => {
          const style = insightConfig[severity];
          const Icon = style.icon;
          return (
            <Card key={severity} className="border-card-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
                  <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[26px] font-bold tracking-tight text-foreground">{counts[severity]}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-card-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-card-border">
          <div>
            <CardTitle className="text-[15px] font-semibold">Recomendaciones</CardTitle>
            <CardDescription className="text-[13px]">Priorizadas por nivel de riesgo</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </>
          ) : (
            insights.map((insight) => <InsightItem key={insight.id} insight={insight} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
