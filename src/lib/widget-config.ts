export type KpiId = "kpi-products" | "kpi-value" | "kpi-alerts" | "kpi-movements";
export type WidgetId =
  | "chart-flow"
  | "chart-categories"
  | "insights"
  | "low-stock"
  | "recent-movements"
  | "sales-trend";

export interface KpiDef {
  id: KpiId;
  name: string;
  description: string;
}

export interface WidgetDef {
  id: WidgetId;
  name: string;
  description: string;
  size: "full" | "half";
}

export const KPI_CATALOG: KpiDef[] = [
  { id: "kpi-products", name: "Total de productos", description: "SKUs registrados en el catálogo" },
  { id: "kpi-value", name: "Valor del inventario", description: "Valor total en soles (S/.)" },
  { id: "kpi-alerts", name: "Alertas de stock", description: "Productos bajo el nivel mínimo" },
  { id: "kpi-movements", name: "Movimientos del día", description: "Entradas y salidas registradas hoy" },
];

export const WIDGET_CATALOG: WidgetDef[] = [
  {
    id: "chart-flow",
    name: "Flujo de inventario",
    description: "Gráfica de entradas vs salidas en el período",
    size: "full",
  },
  {
    id: "chart-categories",
    name: "Distribución por categorías",
    description: "Valor e ítems por categoría de producto",
    size: "half",
  },
  {
    id: "insights",
    name: "Resumen inteligente",
    description: "Recomendaciones automáticas basadas en tus datos",
    size: "half",
  },
  {
    id: "low-stock",
    name: "Inventario crítico",
    description: "Productos bajo su umbral de stock mínimo",
    size: "half",
  },
  {
    id: "recent-movements",
    name: "Movimientos recientes",
    description: "Últimas entradas, salidas y ajustes registrados",
    size: "half",
  },
  {
    id: "sales-trend",
    name: "Variación de ventas",
    description: "Productos con mayor cambio en ventas vs la semana pasada",
    size: "half",
  },
];

export interface DashboardConfig {
  kpis: KpiId[];
  widgets: WidgetId[];
}

export const DEFAULT_CONFIG: DashboardConfig = {
  kpis: ["kpi-products", "kpi-value", "kpi-alerts", "kpi-movements"],
  widgets: ["chart-flow", "insights", "low-stock", "sales-trend"],
};

const STORAGE_KEY = "dashboard-config-v3";

export function loadConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis : DEFAULT_CONFIG.kpis,
      widgets: Array.isArray(parsed.widgets) ? parsed.widgets : DEFAULT_CONFIG.widgets,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: DashboardConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
