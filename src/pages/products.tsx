import { useState } from "react";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useGetProductVelocity,
  getListProductsQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Abarrotes", "Útiles de Oficina", "Limpieza", "Electrónica", "Herramientas", "Otro"];
const UNITS = ["unidad", "caja", "paquete", "kg", "litro", "docena", "saco", "botella", "lata", "bolsa"];
const ALL_CATEGORIES_VALUE = "__all_categories__";

const productSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sku: z.string().min(1, "SKU requerido"),
  category: z.string().min(1, "Categoría requerida"),
  quantity: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0),
  unit: z.string().min(1, "Unidad requerida"),
  lotSize: z.coerce.number().int().min(1).optional(),
  restockFrequency: z.coerce.number().int().min(1).optional().or(z.literal("")),
  description: z.string().optional(),
  supplier: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

function VelocityBadge({ salesPerDay, daysRemaining }: { salesPerDay: number; daysRemaining: number | null }) {
  if (salesPerDay === 0) {
    return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> Sin ventas</span>;
  }
  const urgency = daysRemaining !== null && daysRemaining <= 7 ? "text-red-400" : daysRemaining !== null && daysRemaining <= 30 ? "text-amber-400" : "text-emerald-400";
  const Icon = daysRemaining !== null && daysRemaining <= 14 ? TrendingDown : TrendingUp;
  return (
    <div className="text-right">
      <p className={`text-xs font-semibold flex items-center justify-end gap-1 ${urgency}`}>
        <Icon className="w-3 h-3" />
        {salesPerDay.toFixed(1)}/día
      </p>
      {daysRemaining !== null && (
        <p className={`text-[11px] ${urgency}`}>~{daysRemaining}d</p>
      )}
    </div>
  );
}

export function Products() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useListProducts();
  const { data: velocity } = useGetProductVelocity();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const velocityMap = new Map((velocity ?? []).map(v => [v.productId, v]));

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", sku: "", category: "", quantity: 0, minStock: 5, price: 0, unit: "unidad", lotSize: 1, restockFrequency: "", description: "", supplier: "" },
  });

  const filtered = (products ?? []).filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  function openCreate() {
    setEditingId(null);
    form.reset({ name: "", sku: "", category: "", quantity: 0, minStock: 5, price: 0, unit: "unidad", lotSize: 1, restockFrequency: "", description: "", supplier: "" });
    setDialogOpen(true);
  }

  function openEdit(product: typeof filtered[0]) {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      minStock: product.minStock,
      price: product.price,
      unit: product.unit,
      lotSize: product.lotSize ?? 1,
      restockFrequency: product.restockFrequency ?? "",
      description: product.description ?? "",
      supplier: product.supplier ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(data: ProductForm) {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    const payload = {
      ...data,
      restockFrequency: data.restockFrequency === "" || data.restockFrequency === undefined ? undefined : Number(data.restockFrequency),
    };
    if (editingId !== null) {
      updateProduct.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Producto actualizado" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Producto creado" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Error al crear", variant: "destructive" }),
      });
    }
  }

  function onDelete(id: number) {
    deleteProduct.mutate({ id }, {
      onSuccess: () => { toast({ title: "Producto eliminado" }); setDeleteId(null); queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); },
      onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de inventario.</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-product">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select
              value={filterCategory || ALL_CATEGORIES_VALUE}
              onValueChange={(value) => setFilterCategory(value === ALL_CATEGORIES_VALUE ? "" : value)}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>Todas las categorías</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Package className="w-10 h-10 opacity-30" />
              <p>No se encontraron productos.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Ventas 30d</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const vel = velocityMap.get(p.id);
                  const isUrgent = vel != null && vel.daysRemaining != null && vel.daysRemaining <= 7;
                  const dateStr = new Date(p.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "2-digit" });
                  return (
                    <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.lotSize && p.lotSize > 1 && (
                            <p className="text-[11px] text-muted-foreground">Lote: {p.lotSize} {p.unit}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.supplier ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">S/. {p.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold flex items-center justify-end gap-1 ${isUrgent ? "text-destructive" : ""}`}>
                          {isUrgent && <AlertTriangle className="w-3 h-3" />}
                          {p.quantity} {p.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {vel ? (
                          <VelocityBadge salesPerDay={vel.salesPerDay} daysRemaining={vel.daysRemaining ?? null} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{dateStr}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-${p.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-sku" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (S/.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} data-testid="input-product-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de compra</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-unit">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Inicial</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-product-quantity" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minStock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-product-min-stock" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Divider for purchasing info */}
                <div className="col-span-2 pt-1 border-t border-border">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Datos de compra</p>
                </div>

                <FormField control={form.control} name="lotSize" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades por lote</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} placeholder="Ej: 20" data-testid="input-product-lot-size" /></FormControl>
                    <FormDescription className="text-[11px]">Cuántas unidades tiene una caja/paquete de compra</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="restockFrequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reposición (días)</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} placeholder="Ej: 30" data-testid="input-product-restock-freq" /></FormControl>
                    <FormDescription className="text-[11px]">Cada cuántos días sueles reponer</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-supplier" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} data-testid="button-submit-product">
                  {editingId ? "Guardar Cambios" : "Crear Producto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Esta accion es irreversible. Se eliminaran todos los movimientos asociados.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && onDelete(deleteId)} disabled={deleteProduct.isPending} data-testid="button-confirm-delete">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
