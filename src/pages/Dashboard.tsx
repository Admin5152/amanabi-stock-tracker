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
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">Overview of all warehouse operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-glow hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <Warehouse className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {stats.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active locations</p>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-glow hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique products tracked</p>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-glow hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalStock}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Units in inventory</p>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-card transition-all duration-300 hover:border-primary/20 hover:shadow-glow hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalSold}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Units sold overall</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Breakdown */}
      <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-br from-card to-card/80 shadow-elevated transition-all hover:border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-xl">Warehouse Overview</CardTitle>
          <CardDescription>Stock levels across all locations</CardDescription>
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
            <div className="space-y-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.warehouse_name}
                  className="group flex items-center justify-between rounded-xl border-2 border-border/50 bg-gradient-to-r from-secondary/30 to-secondary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{stat.warehouse_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stat.total_items} items tracked
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {stat.total_stock}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Available</p>
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
