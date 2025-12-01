import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Search, Filter, Calendar } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [newItem, setNewItem] = useState({
    item_name: '',
    week_number: 1,
    previous_stock: 0,
    sold_out: 0,
    notes: '',
  });
  const { toast } = useToast();
  const [canManage, setCanManage] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setCanManage(false);
        setRoleLoading(false);
        return;
      }
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id);
      const allowed = roles?.some((r: any) => r.role === 'manager' || r.role === 'admin') ?? false;
      setCanManage(allowed);
      setRoleLoading(false);
    };
    checkRole();
  }, []);

  const warehouseName = warehouse === 'nsakena' ? 'Nsakena' 
    : warehouse === 'yellow-sack' ? 'Yellow Sack' 
    : warehouse === 'viv' ? 'Viv'
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

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again and try adding the item.',
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
      created_by: userData.user.id,
    };

    const { data, error } = await supabase
      .from('warehouse_items')
      .insert([itemToAdd])
      .select()
      .single();

    if (error) {
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        toast({
          title: 'Permission Denied',
          description: "You don't have permission to add items. Contact your manager for access.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
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
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          toast({
            title: 'Permission Denied',
            description: "You don't have permission to edit items. Contact your manager for access.",
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
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
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        toast({
          title: 'Permission Denied',
          description: "You don't have permission to delete items. Contact your manager for access.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      setItems(items.filter((i) => i.id !== id));
      toast({
        title: 'Success',
        description: 'Item deleted',
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPreviousStock = filteredItems.reduce((acc, item) => acc + item.previous_stock, 0);
  const totalSoldOut = filteredItems.reduce((acc, item) => acc + item.sold_out, 0);
  const totalAvailableStock = filteredItems.reduce((acc, item) => acc + (item.available_stock || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{warehouseName} Warehouse</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Week {currentWeek} • {new Date(currentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              disabled={!canManage || roleLoading}
              onClick={() => {
                if (!canManage) {
                  toast({
                    title: 'Permission Denied',
                    description: "You don't have permission to add items. Contact your manager for access.",
                    variant: 'destructive',
                  });
                  return;
                }
                setNewItem({ 
                  item_name: '', 
                  week_number: currentWeek, 
                  previous_stock: 0, 
                  sold_out: 0, 
                  notes: '' 
                });
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Enter the details for the new inventory item.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              addNewItem();
            }} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Enter item name..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Available Stock</Label>
                  <Input
                    type="number"
                    value={newItem.previous_stock - newItem.sold_out}
                    disabled
                    className="bg-muted"
                  />
                </div>
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
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Item</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Controls */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Week Number</Label>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={currentWeek}
              onChange={(e) => setCurrentWeek(parseInt(e.target.value) || 1)}
              min="1"
              className="text-lg font-semibold h-12"
            />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Week Date</Label>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="text-lg font-semibold h-12"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Available Stock</Label>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalAvailableStock < 0 ? 'text-destructive' : 'text-primary'}`}>
              {totalAvailableStock}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="border-2">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Managing stock for Week {currentWeek}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Item Name</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Prev. Stock</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Sold</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Available</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Notes</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No items for this week. Click "Add New Item" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {item.notes ? item.notes.split(' ')[0] : 'Item'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.previous_stock}</TableCell>
                          <TableCell className="text-center">{item.sold_out}</TableCell>
                          <TableCell className="text-center">
                            <span className={item.available_stock !== null && item.available_stock < 0 ? 'text-destructive font-semibold' : ''}>
                              {item.available_stock ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!canManage}
                                onClick={() => {
                                  // Edit functionality can be expanded
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={!canManage}
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Totals</TableCell>
                        <TableCell className="text-center">{totalPreviousStock}</TableCell>
                        <TableCell className="text-center">{totalSoldOut}</TableCell>
                        <TableCell className="text-center">
                          <span className={totalAvailableStock < 0 ? 'text-destructive' : ''}>
                            {totalAvailableStock}
                          </span>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
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
