import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, TrendingUp, Warehouse } from 'lucide-react';

interface WarehouseStats {
  warehouse_name: string;
  total_items: number;
  total_stock: number;
  total_sold: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<WarehouseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('warehouse_name, previous_stock, sold_out, available_stock');

    if (!error && data) {
      const statsMap = new Map<string, WarehouseStats>();
      
      data.forEach((item) => {
        if (!statsMap.has(item.warehouse_name)) {
          statsMap.set(item.warehouse_name, {
            warehouse_name: item.warehouse_name,
            total_items: 0,
            total_stock: 0,
            total_sold: 0,
          });
        }
        const stat = statsMap.get(item.warehouse_name)!;
        stat.total_items += 1;
        stat.total_stock += item.available_stock || 0;
        stat.total_sold += item.sold_out || 0;
      });

      setStats(Array.from(statsMap.values()));
    }
    setLoading(false);
  };

  const totalStock = stats.reduce((acc, s) => acc + s.total_stock, 0);
  const totalSold = stats.reduce((acc, s) => acc + s.total_sold, 0);
  const totalItems = stats.reduce((acc, s) => acc + s.total_items, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all warehouse operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card transition-all hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card className="shadow-card transition-all hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Unique products tracked</p>
          </CardContent>
        </Card>

        <Card className="shadow-card transition-all hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">Units in inventory</p>
          </CardContent>
        </Card>

        <Card className="shadow-card transition-all hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSold}</div>
            <p className="text-xs text-muted-foreground">Units sold overall</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Warehouse Overview</CardTitle>
          <CardDescription>Stock levels across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : stats.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No data available. Start by adding items to your warehouses.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.warehouse_name}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <h3 className="font-semibold">{stat.warehouse_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stat.total_items} items tracked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{stat.total_stock}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
