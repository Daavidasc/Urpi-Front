export type InsightSeverity = "risk" | "warning" | "info" | "positive";

export interface InsightProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  unit: string;
  lotSize?: number;
  restockFrequency?: number | null;
  createdAt?: string;
}

export interface InsightVelocity {
  productId: number;
  salesPerDay: number;
  daysRemaining?: number | null;
  totalSales30d: number;
}

export interface InsightCategory {
  category: string;
  count: number;
}

export interface InsightStats {
  totalProducts?: number;
  totalValue?: number;
  lowStockCount?: number;
  todayMovements?: number;
}

export interface InsightHistory {
  date: string;
  entradas: number;
  salidas: number;
}

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
}

export interface InsightInput {
  stats?: InsightStats;
  categories?: InsightCategory[];
  products?: InsightProduct[];
  lowStock?: InsightProduct[];
  history?: InsightHistory[];
  velocity?: InsightVelocity[];
  windowDays?: number;
}

const severityRank: Record<InsightSeverity, number> = {
  risk: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

function formatSoles(value: number): string {
  return `S/. ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildInsights({ stats, categories, products, lowStock, velocity }: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const low = lowStock ?? [];
  const all = products ?? [];
  const velMap = new Map((velocity ?? []).map(v => [v.productId, v]));

  function lotLabel(p: InsightProduct): string {
    const ls = p.lotSize ?? 1;
    const deficit = Math.max(0, p.minStock * 2 - p.quantity);
    const lotsNeeded = ls > 1 ? Math.ceil(deficit / ls) : 0;
    if (ls > 1 && lotsNeeded > 0) {
      return `${p.name} (pide ${lotsNeeded} ${lotsNeeded === 1 ? "caja" : "cajas"} de ${ls} ${p.unit})`;
    }
    return `${p.name} (${p.quantity} ${p.unit})`;
  }

  // Out of stock
  const outOfStock = all.filter((p) => p.quantity <= 0);
  if (outOfStock.length > 0) {
    const names = outOfStock.slice(0, 3).map(lotLabel).join(", ");
    insights.push({
      id: "out-of-stock",
      severity: "risk",
      title: `${outOfStock.length} producto${outOfStock.length > 1 ? "s" : ""} agotado${outOfStock.length > 1 ? "s" : ""}`,
      description: `Sin stock disponible: ${names}${outOfStock.length > 3 ? " y otros" : ""}. Reabastece de inmediato para no perder ventas.`,
    });
  }

  // Velocity-based: products running out in ≤7 days
  const urgentVelocity = all.filter(p => {
    const v = velMap.get(p.id);
    return v && v.salesPerDay > 0 && v.daysRemaining != null && v.daysRemaining <= 7 && p.quantity > 0;
  });
  if (urgentVelocity.length > 0) {
    const names = urgentVelocity.slice(0, 3).map(p => {
      const v = velMap.get(p.id)!;
      return `${p.name} (~${v.daysRemaining}d)`;
    }).join(", ");
    insights.push({
      id: "velocity-urgent",
      severity: "risk",
      title: `${urgentVelocity.length} producto${urgentVelocity.length > 1 ? "s" : ""} se agota en menos de 7 días`,
      description: `Al ritmo actual de ventas: ${names}${urgentVelocity.length > 3 ? " entre otros" : ""}. Compra urgente.`,
    });
  }

  // Velocity-based: running out before next restock window (8–30 days)
  const soonVelocity = all.filter(p => {
    const v = velMap.get(p.id);
    const freq = p.restockFrequency ?? 30;
    return v && v.salesPerDay > 0 && v.daysRemaining != null && v.daysRemaining > 7 && v.daysRemaining < freq
      && !urgentVelocity.includes(p);
  });
  if (soonVelocity.length > 0) {
    const names = soonVelocity.slice(0, 3).map(p => {
      const v = velMap.get(p.id)!;
      return `${p.name} (~${v.daysRemaining}d)`;
    }).join(", ");
    insights.push({
      id: "velocity-soon",
      severity: "warning",
      title: `${soonVelocity.length} producto${soonVelocity.length > 1 ? "s" : ""} se agota antes del próximo pedido`,
      description: `Considera adelantar la compra de ${names}${soonVelocity.length > 3 ? " entre otros" : ""} para no quedarte corto.`,
    });
  }

  // Low-stock WITH velocity → warning (compra recomendada)
  const criticalWithSales = low
    .filter(p => {
      const v = velMap.get(p.id);
      return p.quantity > 0 && !urgentVelocity.includes(p) && v && v.salesPerDay > 0;
    })
    .sort((a, b) => a.quantity / Math.max(1, a.minStock) - b.quantity / Math.max(1, b.minStock));
  if (criticalWithSales.length > 0) {
    const top = criticalWithSales.slice(0, 3).map(lotLabel).join(", ");
    insights.push({
      id: "low-stock",
      severity: "warning",
      title: `${criticalWithSales.length} producto${criticalWithSales.length > 1 ? "s" : ""} bajo el mínimo con ventas activas`,
      description: `Prioriza la reposición de ${top}${criticalWithSales.length > 3 ? " entre otros" : ""} antes de que se agoten.`,
    });
  }

  // Low-stock WITHOUT velocity → info only (sin ventas, no se recomienda comprar)
  const criticalNoSales = low
    .filter(p => {
      const v = velMap.get(p.id);
      return p.quantity > 0 && !urgentVelocity.includes(p) && (!v || v.salesPerDay === 0);
    });
  if (criticalNoSales.length > 0) {
    const names = criticalNoSales.slice(0, 3).map(p => p.name).join(", ");
    insights.push({
      id: "low-stock-no-sales",
      severity: "info",
      title: `${criticalNoSales.length} producto${criticalNoSales.length > 1 ? "s" : ""} bajo el mínimo sin ventas recientes`,
      description: `${names}${criticalNoSales.length > 3 ? " entre otros" : ""} tienen poco stock pero no han tenido salidas en 30 días. Repón según tu calendario habitual.`,
    });
  }

  // Products with NO velocity but have stock (dead stock risk)
  const noSales = all.filter(p => {
    const v = velMap.get(p.id);
    const daysSincePurchase = p.createdAt
      ? Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return v && v.salesPerDay === 0 && v.totalSales30d === 0 && daysSincePurchase > 14 && p.quantity > 0;
  });
  if (noSales.length > 0) {
    insights.push({
      id: "dead-stock",
      severity: "info",
      title: `${noSales.length} producto${noSales.length > 1 ? "s sin ventas" : " sin ventas"} en 30 días`,
      description: `${noSales.slice(0, 3).map(p => p.name).join(", ")}${noSales.length > 3 ? " entre otros" : ""} no tienen movimiento de salida. Revisa si tienen demanda o si conviene reducir su stock.`,
    });
  }

  // Category concentration
  if (categories && categories.length > 0 && stats?.totalProducts) {
    const top = [...categories].sort((a, b) => b.count - a.count)[0];
    const pct = Math.round((top.count / stats.totalProducts) * 100);
    insights.push({
      id: "category-concentration",
      severity: pct >= 50 ? "warning" : "info",
      title: `${top.category} domina tu catálogo`,
      description:
        pct >= 50
          ? `${top.category} concentra el ${pct}% de tus productos. Considera diversificar para reducir el riesgo de depender de una sola categoría.`
          : `${top.category} es tu categoría principal con ${top.count} productos (${pct}% del catálogo).`,
    });
  }

  // Overstock
  const overstock = all.filter((p) => p.minStock > 0 && p.quantity > p.minStock * 5);
  if (overstock.length > 0) {
    const capital = overstock.reduce((sum, p) => sum + p.quantity * p.price, 0);
    insights.push({
      id: "overstock",
      severity: "info",
      title: `${overstock.length} producto${overstock.length > 1 ? "s" : ""} con sobrestock`,
      description: `Tienes ${formatSoles(capital)} en capital inmovilizado por exceso de inventario. Evalúa promociones para liberar liquidez.`,
    });
  }

  if (stats?.totalValue) {
    insights.push({
      id: "inventory-value",
      severity: "info",
      title: "Valor total del inventario",
      description: `Tu inventario está valorizado en ${formatSoles(stats.totalValue)} distribuido en ${stats.totalProducts ?? all.length} productos.`,
    });
  }

  if (insights.every((i) => i.severity !== "risk" && i.severity !== "warning")) {
    insights.unshift({
      id: "healthy",
      severity: "positive",
      title: "Inventario bajo control",
      description: "No se detectaron riesgos de stock. Mantén el registro de movimientos para conservar esta salud operativa.",
    });
  }

  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
