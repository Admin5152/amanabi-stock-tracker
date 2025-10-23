import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';
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
    const newItem = {
      warehouse_name: warehouseName,
      week_number: currentWeek,
      week_date: currentDate,
      item_name: 'New Item',
      previous_stock: 0,
      sold_out: 0,
      notes: null,
    };

    const { data, error } = await supabase
      .from('warehouse_items')
      .insert([newItem])
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {warehouseName} Warehouse
          </h1>
          <p className="mt-1 text-muted-foreground">Manage inventory and track weekly sales</p>
        </div>
        <Button 
          onClick={addNewItem} 
          className="gap-2 bg-gradient-to-r from-primary to-accent shadow-lg transition-all hover:shadow-glow hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all hover:border-primary/20 hover:shadow-elevated">
          <CardHeader className="pb-3">
            <Label htmlFor="week" className="text-sm font-semibold">Week Number</Label>
          </CardHeader>
          <CardContent>
            <Input
              id="week"
              type="number"
              value={currentWeek}
              onChange={(e) => setCurrentWeek(parseInt(e.target.value) || 1)}
              min="1"
              className="border-2 transition-all focus:border-primary"
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all hover:border-primary/20 hover:shadow-elevated">
          <CardHeader className="pb-3">
            <Label htmlFor="date" className="text-sm font-semibold">Week Date</Label>
          </CardHeader>
          <CardContent>
            <Input
              id="date"
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border-2 transition-all focus:border-primary"
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Total Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalAvailableStock}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-elevated transition-all hover:border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2 border-border/50">
          <CardTitle className="text-xl">Stock Items - Week {currentWeek}</CardTitle>
          <CardDescription className="text-base">
            {new Date(currentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
                  <TableRow className="bg-gradient-to-r from-primary/10 to-accent/10 border-b-2 border-primary/20">
                    <TableHead className="font-bold text-foreground">Item Name</TableHead>
                    <TableHead className="font-bold text-foreground">Previous Stock</TableHead>
                    <TableHead className="font-bold text-foreground">Sold Out</TableHead>
                    <TableHead className="font-bold text-foreground">Available Stock</TableHead>
                    <TableHead className="font-bold text-foreground">Notes</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
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
                        className={`transition-all hover:bg-primary/5 ${index % 2 === 0 ? 'bg-secondary/20' : ''}`}
                      >
                        <TableCell>
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                            className="border-0 bg-transparent focus-visible:ring-1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.previous_stock}
                            onChange={(e) =>
                              updateItem(item.id, 'previous_stock', parseInt(e.target.value) || 0)
                            }
                            className="border-0 bg-transparent focus-visible:ring-1"
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
                            className="border-0 bg-transparent focus-visible:ring-1"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {item.available_stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            placeholder="Add notes..."
                            className="border-0 bg-transparent focus-visible:ring-1"
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
                    <TableRow className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 font-bold">
                      <TableCell className="text-base">Total</TableCell>
                      <TableCell className="text-base">{totalPreviousStock}</TableCell>
                      <TableCell className="text-base">{totalSoldOut}</TableCell>
                      <TableCell className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
