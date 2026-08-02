import { useState } from "react";
import {
  useListMovements,
  useCreateMovement,
  useListProducts,
  getListMovementsQueryKey,
  getListProductsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const movementSchema = z.object({
  productId: z.coerce.number().int().positive("Selecciona un producto"),
  type: z.enum(["entrada", "salida", "ajuste"]),
  quantity: z.coerce.number().int().positive("Cantidad debe ser mayor a 0"),
  reason: z.string().min(1, "Motivo requerido"),
});
type MovementForm = z.infer<typeof movementSchema>;
const ALL_TYPES_VALUE = "__all_types__";

function MovementBadge({ type }: { type: string }) {
  if (type === "entrada") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><ArrowDownCircle className="w-3 h-3 mr-1" />Entrada</Badge>;
  if (type === "salida") return <Badge className="bg-red-100 text-red-800 border-red-200"><ArrowUpCircle className="w-3 h-3 mr-1" />Salida</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><SlidersHorizontal className="w-3 h-3 mr-1" />Ajuste</Badge>;
}

export function Movements() {
  const [filterType, setFilterType] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: movements, isLoading } = useListMovements({ limit: 200 });
  const { data: products } = useListProducts();
  const createMovement = useCreateMovement();

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: { productId: 0, type: "entrada", quantity: 1, reason: "" },
  });

  const filtered = (movements ?? []).filter(m => !filterType || m.type === filterType);

  function onSubmit(data: MovementForm) {
    createMovement.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Movimiento registrado" });
        setDialogOpen(false);
        form.reset({ productId: 0, type: "entrada", quantity: 1, reason: "" });
        queryClient.invalidateQueries({ queryKey: getListMovementsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      },
      onError: () => toast({ title: "Error al registrar movimiento", variant: "destructive" }),
    });
  }

  const entradas = (movements ?? []).filter(m => m.type === "entrada").reduce((s, m) => s + m.quantity, 0);
  const salidas = (movements ?? []).filter(m => m.type === "salida").reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">Registro de entradas, salidas y ajustes de inventario.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-movement">
          <Plus className="w-4 h-4 mr-2" /> Registrar Movimiento
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowDownCircle className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Entradas</p>
              <p className="text-2xl font-bold text-emerald-600">{entradas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Salidas</p>
              <p className="text-2xl font-bold text-red-600">{salidas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Balance Neto</p>
              <p className={`text-2xl font-bold ${entradas - salidas >= 0 ? "text-emerald-600" : "text-red-600"}`}>{entradas - salidas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="flex-1">Historial</CardTitle>
            <Select
              value={filterType || ALL_TYPES_VALUE}
              onValueChange={(value) => setFilterType(value === ALL_TYPES_VALUE ? "" : value)}
            >
              <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES_VALUE}>Todos los tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <SlidersHorizontal className="w-10 h-10 opacity-30" />
              <p>No hay movimientos registrados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id} data-testid={`row-movement-${m.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="font-medium">{m.productName}</TableCell>
                    <TableCell><MovementBadge type={m.type} /></TableCell>
                    <TableCell className="text-right font-bold">{m.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="productId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={v => field.onChange(parseInt(v))}>
                    <FormControl>
                      <SelectTrigger data-testid="select-movement-product">
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(products ?? []).map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.quantity} {p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-movement-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="ajuste">Ajuste de inventario</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} data-testid="input-movement-quantity" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej: Compra a proveedor, venta al cliente..." data-testid="input-movement-reason" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMovement.isPending} data-testid="button-submit-movement">
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
