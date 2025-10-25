import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

interface WarehouseItem {
  id: string;
  week_number: number;
  week_date: string;
  item_name: string;
  previous_stock: number;
  sold_out: number;
  available_stock: number;
  notes: string | null;
}

const itemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required').max(100),
  previous_stock: z.number().min(0, 'Stock cannot be negative'),
  sold_out: z.number().min(0, 'Sold out cannot be negative'),
});

export default function Warehouse() {
  const { warehouse } = useParams();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    week_number: 1,
    previous_stock: 0,
    sold_out: 0,
    notes: '',
  });
  const { toast } = useToast();

  const warehouseName = warehouse === 'nsakena' ? 'Nsakena' 
    : warehouse === 'yellow-sack' ? 'Yellow Sack' 
    : 'Dossia';

  useEffect(() => {
    loadItems();
  }, [warehouse, currentWeek]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('warehouse_name', warehouseName)
      .eq('week_number', currentWeek)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setItems(data);
      if (data.length > 0) {
        setCurrentDate(data[0].week_date);
      }
    }
    setLoading(false);
  };

  const addNewItem = async () => {
    if (!newItem.item_name.trim()) {
      toast({
        title: 'Error',
        description: 'Item name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    const itemToAdd = {
      warehouse_name: warehouseName,
      week_number: newItem.week_number,
      week_date: currentDate,
      item_name: newItem.item_name,
      previous_stock: newItem.previous_stock,
      sold_out: newItem.sold_out,
      notes: newItem.notes || null,
    };

    const { data, error } = await supabase
      .from('warehouse_items')
      .insert([itemToAdd])
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setItems([...items, data]);
      setDialogOpen(false);
      setNewItem({
        item_name: '',
        week_number: currentWeek,
        previous_stock: 0,
        sold_out: 0,
        notes: '',
      });
      toast({
        title: 'Success',
        description: 'New item added',
      });
    }
  };

  const updateItem = async (id: string, field: string, value: any) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updatedItem = { ...item, [field]: value };

    try {
      const validation = itemSchema.safeParse({
        item_name: updatedItem.item_name,
        previous_stock: updatedItem.previous_stock,
        sold_out: updatedItem.sold_out,
      });

      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('warehouse_items')
        .update({ [field]: value })
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('warehouse_items').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setItems(items.filter((i) => i.id !== id));
      toast({
        title: 'Success',
        description: 'Item deleted',
      });
    }
  };

  const totalPreviousStock = items.reduce((acc, item) => acc + item.previous_stock, 0);
  const totalSoldOut = items.reduce((acc, item) => acc + item.sold_out, 0);
  const totalAvailableStock = items.reduce((acc, item) => acc + (item.available_stock || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-2">
            {warehouseName} Warehouse
          </h1>
          <p className="text-lg text-muted-foreground">Week {currentWeek} • {new Date(currentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2 h-11 px-6 text-base font-semibold"
              onClick={() => setNewItem({ 
                item_name: '', 
                week_number: currentWeek, 
                previous_stock: 0, 
                sold_out: 0, 
                notes: '' 
              })}
            >
              <Plus className="h-5 w-5" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Enter the details for the new inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Enter item name..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="week-number">Week Number</Label>
                <Input
                  id="week-number"
                  type="number"
                  min="1"
                  value={newItem.week_number}
                  onChange={(e) => setNewItem({ ...newItem, week_number: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="previous-stock">Previous Stock</Label>
                <Input
                  id="previous-stock"
                  type="number"
                  min="0"
                  value={newItem.previous_stock}
                  onChange={(e) => setNewItem({ ...newItem, previous_stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sold-out">Sold Out</Label>
                <Input
                  id="sold-out"
                  type="number"
                  min="0"
                  value={newItem.sold_out}
                  onChange={(e) => setNewItem({ ...newItem, sold_out: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="available-stock">Available Stock (Auto-calculated)</Label>
                <Input
                  id="available-stock"
                  type="number"
                  value={newItem.previous_stock - newItem.sold_out}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Add any notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addNewItem}>
                Save Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <Label htmlFor="week" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Week Number</Label>
          </CardHeader>
          <CardContent>
            <Input
              id="week"
              type="number"
              value={currentWeek}
              onChange={(e) => setCurrentWeek(parseInt(e.target.value) || 1)}
              min="1"
              className="h-12 text-lg font-semibold"
            />
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <Label htmlFor="date" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Week Date</Label>
          </CardHeader>
          <CardContent>
            <Input
              id="date"
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </CardContent>
        </Card>

        <Card className="border border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total Available Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {totalAvailableStock}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="bg-secondary/50 border-b border-border">
          <CardTitle className="text-2xl font-bold text-foreground">Inventory Items</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            Manage stock levels and track sales for Week {currentWeek}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border">
                    <TableHead className="font-semibold text-foreground h-12">Item Name</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Previous Stock</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Sold Out</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Available Stock</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Notes</TableHead>
                    <TableHead className="w-[80px] h-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No items for this week. Click "Add Item" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={`transition-colors hover:bg-muted/50 h-14 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <TableCell>
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                            className="border-0 bg-transparent focus-visible:ring-1 h-10 font-medium"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.previous_stock}
                            onChange={(e) =>
                              updateItem(item.id, 'previous_stock', parseInt(e.target.value) || 0)
                            }
                            className="border-0 bg-transparent focus-visible:ring-1 h-10 font-medium"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.sold_out}
                            onChange={(e) =>
                              updateItem(item.id, 'sold_out', parseInt(e.target.value) || 0)
                            }
                            className="border-0 bg-transparent focus-visible:ring-1 h-10 font-medium"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg text-primary">
                            {item.available_stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            placeholder="Add notes..."
                            className="border-0 bg-transparent focus-visible:ring-1 h-10"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem(item.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {items.length > 0 && (
                    <TableRow className="border-t-2 border-border bg-muted/30 font-bold h-16">
                      <TableCell className="text-lg">Total</TableCell>
                      <TableCell className="text-lg">{totalPreviousStock}</TableCell>
                      <TableCell className="text-lg">{totalSoldOut}</TableCell>
                      <TableCell className="text-2xl text-primary">
                        {totalAvailableStock}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
