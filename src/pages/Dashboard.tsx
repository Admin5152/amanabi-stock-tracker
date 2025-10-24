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
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-border pb-6">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Overview of all warehouse operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total Warehouses</CardTitle>
            <Warehouse className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {stats.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Active locations</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total Items</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {totalItems}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Unique products tracked</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Available Stock</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {totalStock}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Units in inventory</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total Sold</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {totalSold}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Units sold overall</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Breakdown */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="bg-secondary/50 border-b border-border">
          <CardTitle className="text-2xl font-bold text-foreground">Warehouse Overview</CardTitle>
          <CardDescription className="text-base mt-1">Stock levels across all locations</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
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
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{stat.warehouse_name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {stat.total_items} items tracked
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-primary">
                      {stat.total_stock}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Available</p>
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
