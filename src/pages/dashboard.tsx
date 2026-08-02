import {
  useGetDashboardStats,
  useGetMovementHistory,
  useListProducts,
  useGetCategoryBreakdown,
  useListMovements,
  useGetSalesTrend,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCcw,
  ArrowRight,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  BarChart3,
  LineChart,
  Lightbulb,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buildInsights } from "@/lib/insights";
import { InsightItem } from "@/components/insights-ui";
import {
  loadConfig,
  saveConfig,
  KPI_CATALOG,
  WIDGET_CATALOG,
  type DashboardConfig,
  type KpiId,
  type WidgetId,
} from "@/lib/widget-config";

// ─── Individual KPI card ────────────────────────────────────────────────────

const KPI_META = {
  "kpi-products": { title: "TOTAL PRODUCTOS", icon: Package, getValue: (s: any) => s?.totalProducts, alert: false },
  "kpi-value": {
    title: "VALOR INVENTARIO",
    icon: DollarSign,
    getValue: (s: any) => (s?.totalValue != null ? `S/. ${Number(s.totalValue).toLocaleString("es-PE")}` : undefined),
    alert: false,
  },
  "kpi-alerts": {
    title: "ALERTAS STOCK",
    icon: AlertTriangle,
    getValue: (s: any) => s?.lowStockCount,
    isAlert: (s: any) => s?.lowStockCount > 0,
  },
  "kpi-movements": { title: "MOVIMIENTOS HOY", icon: ArrowRightLeft, getValue: (s: any) => s?.todayMovements, alert: false },
} as const;

function KpiCard({ id }: { id: KpiId }) {
  const { data: stats, isLoading } = useGetDashboardStats();
  const meta = KPI_META[id];
  const value = meta.getValue(stats);
  const alert = "isAlert" in meta ? meta.isAlert(stats) : false;
  const Icon = meta.icon;

  return (
    <Card className={`relative overflow-hidden shadow-sm transition-all hover:border-primary/30 ${alert ? "border-destructive/30 bg-destructive/5" : "border-card-border bg-card"}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground">{meta.title}</p>
          <div className={`p-2 rounded-lg ${alert ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-28 rounded-md" />
        ) : (
          <div className={`text-[26px] font-bold tracking-tight ${alert ? "text-destructive" : "text-foreground"}`}>
            {value !== undefined ? value : "0"}
          </div>
        )}
        {alert && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive to-destructive/20" />}
      </CardContent>
    </Card>
  );
}

// ─── Flow chart widget ───────────────────────────────────────────────────────

function FlowChartWidget() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<7 | 30>(7);
  const { data: history, isLoading } = useGetMovementHistory({ days: range });

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden">
      <CardHeader className="flex flex-col gap-4 pb-4 border-b border-card-border">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-[15px] font-semibold">Flujo de Inventario</CardTitle>
            <CardDescription className="text-[13px]">
              {range === 7 ? "Últimos 7 días" : "Últimos 30 días"} — entradas vs salidas
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Entradas</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Salidas</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
            {([7, 30] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {r === 7 ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] p-6">
        {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> :
          history && history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="entradas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#gEnt)" strokeWidth={2.5} name="Entradas" />
                <Area type="monotone" dataKey="salidas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#gSal)" strokeWidth={2.5} name="Salidas" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No hay datos disponibles</div>
          )}
      </CardContent>
    </Card>
  );
}

// ─── Category chart widget ───────────────────────────────────────────────────

function CategoryChartWidget() {
  const { data: categories, isLoading } = useGetCategoryBreakdown();

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-card-border">
        <CardTitle className="text-[15px] font-semibold">Distribución por Categorías</CardTitle>
        <CardDescription className="text-[13px]">Valor e ítems por categoría</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px] p-4">
        {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> :
          categories && categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "12px" }}
                  formatter={(val: number, name: string) => [name === "value" ? `S/. ${val.toLocaleString("es-PE")}` : val, name === "value" ? "Valor" : "Ítems"]}
                />
                <Bar dataKey="count" name="Ítems" radius={[0, 4, 4, 0]}>
                  {categories.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--primary) / ${0.9 - i * 0.12})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No hay categorías</div>
          )}
      </CardContent>
    </Card>
  );
}

// ─── Insights widget ─────────────────────────────────────────────────────────

function InsightsWidget() {
  const { data: stats } = useGetDashboardStats();
  const { data: history } = useGetMovementHistory({ days: 7 });
  const { data: lowStock } = useListProducts({ lowStock: true });
  const { data: products } = useListProducts();
  const { data: categories } = useGetCategoryBreakdown();

  const insights = useMemo(
    () => buildInsights({ stats, categories, products, lowStock, history, windowDays: 7 }),
    [stats, categories, products, lowStock, history],
  );

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-card-border">
        <CardTitle className="text-[15px] font-semibold">Resumen Inteligente</CardTitle>
        <CardDescription className="text-[13px]">Recomendaciones basadas en tus datos</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {insights.length > 0 ? (
          <>
            <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 to-blue-500/5 p-4">
              <p className="font-semibold text-foreground text-[15px] leading-snug">{insights[0].title}</p>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{insights[0].description}</p>
            </div>
            {insights.slice(1, 3).map((insight) => (
              <InsightItem key={insight.id} insight={insight} compact />
            ))}
            <Link href="/insights">
              <Button variant="ghost" className="w-full justify-between text-sm text-muted-foreground hover:text-foreground mt-1">
                Ver todos los insights <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        ) : (
          <Skeleton className="h-32 w-full rounded-xl" />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Low stock widget ────────────────────────────────────────────────────────

function LowStockWidget() {
  const { data: lowStock, isLoading } = useListProducts({ lowStock: true });

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-card-border">
        <div>
          <CardTitle className="text-[15px] font-semibold">Inventario Crítico</CardTitle>
          <CardDescription className="text-[13px]">Productos bajo umbral de seguridad</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : lowStock && lowStock.length > 0 ? (
          <div className="divide-y divide-card-border">
            {lowStock.slice(0, 6).map((p) => {
              const isCritical = p.quantity <= p.minStock * 0.5;
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-sm font-bold ${isCritical ? "text-red-400" : "text-amber-400"}`}>
                      {p.quantity} <span className="text-[11px] font-normal opacity-70">{p.unit}</span>
                    </p>
                    <p className={`text-[11px] font-medium ${isCritical ? "text-red-400" : "text-amber-400"}`}>{isCritical ? "Crítico" : "Bajo"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="font-medium text-foreground">Todo en orden</p>
            <p className="text-sm">No hay productos con stock bajo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent movements widget ─────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  entrada: { label: "Entrada", color: "text-emerald-400" },
  salida: { label: "Salida", color: "text-red-400" },
  ajuste: { label: "Ajuste", color: "text-amber-400" },
};

function RecentMovementsWidget() {
  const { data: movements, isLoading } = useListMovements({ limit: 8 });

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-card-border">
        <div>
          <CardTitle className="text-[15px] font-semibold">Movimientos Recientes</CardTitle>
          <CardDescription className="text-[13px]">Últimas entradas, salidas y ajustes</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
          </div>
        ) : movements && movements.length > 0 ? (
          <div className="divide-y divide-card-border">
            {movements.map((m) => {
              const meta = MOVEMENT_LABELS[m.type] ?? { label: m.type, color: "text-muted-foreground" };
              const date = new Date(m.createdAt).toLocaleDateString("es-PE", { month: "short", day: "numeric" });
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{m.productName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.reason || "Sin motivo"}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4 space-y-0.5">
                    <p className={`text-sm font-bold ${meta.color}`}>
                      {m.type === "salida" ? "-" : "+"}{m.quantity}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">No hay movimientos recientes</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sales trend widget ───────────────────────────────────────────────────────

function SalesTrendWidget() {
  const { data, isLoading } = useGetSalesTrend();

  return (
    <Card className="shadow-sm border-card-border bg-card overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-card-border">
        <div>
          <CardTitle className="text-[15px] font-semibold">Variación de ventas</CardTitle>
          <CardDescription className="text-[13px]">Esta semana vs la semana pasada</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="divide-y divide-card-border">
            {data.map((p) => {
              const up = p.changePct >= 0;
              return (
                <div key={p.productId} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${up ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {up
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.thisWeek} {p.unit} esta semana · {p.lastWeek} {p.unit} anterior
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${up ? "text-emerald-500" : "text-red-500"}`}>
                    {up ? "+" : ""}{p.changePct}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">Sin movimientos recientes</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Widget renderer ─────────────────────────────────────────────────────────

function WidgetRenderer({ id }: { id: WidgetId }) {
  switch (id) {
    case "chart-flow": return <FlowChartWidget />;
    case "chart-categories": return <CategoryChartWidget />;
    case "insights": return <InsightsWidget />;
    case "low-stock": return <LowStockWidget />;
    case "recent-movements": return <RecentMovementsWidget />;
    case "sales-trend": return <SalesTrendWidget />;
  }
}

// ─── Catalog icon map ────────────────────────────────────────────────────────

const WIDGET_ICONS: Record<WidgetId, React.ElementType> = {
  "chart-flow": LineChart,
  "chart-categories": BarChart3,
  "insights": Lightbulb,
  "low-stock": AlertTriangle,
  "recent-movements": Clock,
  "sales-trend": TrendingUp,
};

// ─── Dashboard customizer panel ──────────────────────────────────────────────

function DashboardCustomizer({ config, onChange }: { config: DashboardConfig; onChange: (c: DashboardConfig) => void }) {
  const update = useCallback((c: DashboardConfig) => { onChange(c); saveConfig(c); }, [onChange]);

  const toggleKpi = (id: KpiId) => {
    const kpis = config.kpis.includes(id) ? config.kpis.filter((k) => k !== id) : [...config.kpis, id];
    update({ ...config, kpis });
  };

  const removeWidget = (id: WidgetId) => update({ ...config, widgets: config.widgets.filter((w) => w !== id) });

  const moveWidget = (index: number, dir: -1 | 1) => {
    const next = [...config.widgets];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    update({ ...config, widgets: next });
  };

  const addWidget = (id: WidgetId) => update({ ...config, widgets: [...config.widgets, id] });

  const available = WIDGET_CATALOG.filter((w) => !config.widgets.includes(w.id));

  return (
    <div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-1">
      {/* KPI toggles */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Métricas KPI</p>
        <div className="space-y-0.5 rounded-xl border border-border overflow-hidden">
          {KPI_CATALOG.map(({ id, name, description }) => (
            <div key={id} className="flex items-center justify-between p-3 bg-card hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
              <Switch checked={config.kpis.includes(id)} onCheckedChange={() => toggleKpi(id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Active widgets */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Widgets activos</p>
        {config.widgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No tienes widgets activos. Agrégalos desde el catálogo.
          </div>
        ) : (
          <div className="space-y-2">
            {config.widgets.map((id, i) => {
              const def = WIDGET_CATALOG.find((w) => w.id === id);
              if (!def) return null;
              const Icon = WIDGET_ICONS[id];
              return (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{def.name}</p>
                    <Badge variant="outline" className="text-[10px] h-4 mt-0.5">{def.size === "full" ? "Ancho completo" : "Mitad"}</Badge>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveWidget(i, -1)} disabled={i === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveWidget(i, 1)} disabled={i === config.widgets.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeWidget(id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog */}
      {available.length > 0 && (
        <div>
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Agregar widgets</p>
          <div className="grid grid-cols-2 gap-2">
            {available.map((def) => {
              const Icon = WIDGET_ICONS[def.id];
              return (
                <button key={def.id} onClick={() => addWidget(def.id)}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold leading-tight">{def.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{def.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard page ─────────────────────────────────────────────────────

export function Dashboard() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<DashboardConfig>({ kpis: [], widgets: [] });

  useEffect(() => { setConfig(loadConfig()); }, []);

  const dateStr = new Intl.DateTimeFormat("es-PE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  // Separate full-width and half-width widgets to build grid rows
  const widgetDefs = config.widgets.map((id) => ({
    id,
    size: WIDGET_CATALOG.find((w) => w.id === id)?.size ?? "half",
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Resumen de Inventario</h1>
          <p className="text-muted-foreground capitalize text-[13px] mt-0.5">
            {dateStr} <span className="text-muted-foreground/60">·</span>{" "}
            <span className="font-medium text-foreground/90">Comercial Los Andes</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-lg h-9 text-sm bg-card" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCcw className="w-4 h-4" /> Actualizar
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-lg h-9 text-sm bg-card">
                <SlidersHorizontal className="w-4 h-4" /> Personalizar
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] sm:w-[420px] flex flex-col">
              <SheetHeader>
                <SheetTitle>Personalizar dashboard</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Activa KPIs, reordena widgets con las flechas o agrégalos desde el catálogo. Los cambios se guardan automáticamente.
                </p>
              </SheetHeader>
              <DashboardCustomizer config={config} onChange={setConfig} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* KPI row */}
      {config.kpis.length > 0 && (
        <div className={`grid grid-cols-2 gap-4 ${config.kpis.length >= 3 ? "lg:grid-cols-4" : config.kpis.length === 2 ? "lg:grid-cols-2" : ""}`}>
          {config.kpis.map((id) => <KpiCard key={id} id={id} />)}
        </div>
      )}

      {/* Widget grid */}
      {widgetDefs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {widgetDefs.map(({ id, size }) => (
            <div key={id} className={size === "full" ? "lg:col-span-2" : ""}>
              <WidgetRenderer id={id} />
            </div>
          ))}
        </div>
      )}

      {config.kpis.length === 0 && config.widgets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold text-lg">Dashboard vacío</p>
          <p className="text-muted-foreground text-sm mt-1">Usa el botón Personalizar para agregar métricas y widgets.</p>
        </div>
      )}
    </div>
  );
}
