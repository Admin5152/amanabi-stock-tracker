import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, AlertCircle, Warehouse, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface WarehouseStats {
  warehouse_name: string;
  total_items: number;
  total_stock: number;
  total_sold: number;
}

interface AlertItem {
  item_name: string;
  warehouse_name: string;
  available_stock: number;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<WarehouseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [userName, setUserName] = useState('Manager');

  useEffect(() => {
    loadStats();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]);
      }
    }
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('warehouse_name, previous_stock, sold_out, available_stock, item_name, created_at');

    if (!error && data) {
      const statsMap = new Map<string, WarehouseStats>();
      const lowStockItems: AlertItem[] = [];
      
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

        // Check for low stock (below 10)
        if ((item.available_stock || 0) < 10) {
          lowStockItems.push({
            item_name: item.item_name,
            warehouse_name: item.warehouse_name,
            available_stock: item.available_stock || 0,
            created_at: item.created_at,
          });
        }
      });

      setStats(Array.from(statsMap.values()));
      setAlerts(lowStockItems.slice(0, 5));
    }
    setLoading(false);
  };

  const totalStock = stats.reduce((acc, s) => acc + s.total_stock, 0);
  const totalItems = stats.reduce((acc, s) => acc + s.total_items, 0);
  const alertCount = alerts.length;

  // Prepare chart data
  const chartData = stats.map(s => ({
    name: s.warehouse_name.split(' ')[0],
    stock: s.total_stock,
  }));

  const warehouseIcons: Record<string, string> = {
    'Nsakena': '🏠',
    'Viv': '📦',
    'Yellow Sack': '🏢',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {userName}. Here is your stock summary.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5 self-start">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm">System Operational</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <h3 className="text-2xl font-bold mt-1">GHS 0.00</h3>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <span>↗</span> Estimated
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <h3 className="text-2xl font-bold mt-1">{totalItems}</h3>
                <p className="text-xs text-muted-foreground mt-1">Global Available</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Debt</p>
                <h3 className="text-2xl font-bold text-destructive mt-1">GHS 0.00</h3>
                <p className="text-xs text-destructive mt-1">Outstanding</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <h3 className="text-2xl font-bold mt-1">{alertCount}</h3>
                <p className="text-xs text-destructive mt-1">Items below reorder</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Stock Breakdown */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Warehouse Stock Breakdown</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {stats.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No warehouse data available. Add items to your warehouses to see stats.
                </CardContent>
              </Card>
            ) : (
              stats.map((stat) => (
                <Card key={stat.warehouse_name} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.warehouse_name} Warehouse</p>
                        <h3 className={`text-3xl font-bold mt-2 ${stat.total_stock < 0 ? 'text-destructive' : ''}`}>
                          {stat.total_stock}
                        </h3>
                        <Badge variant="outline" className="mt-2 text-primary border-primary">
                          Available Stock
                        </Badge>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Warehouse className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Charts and Alerts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Stock by Category Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="stock" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts at this time
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-destructive bg-destructive/5"
                  >
                    <div className="flex-1">
                      <p className="font-medium">Low Stock: {alert.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Total available stock ({alert.available_stock}) is below reorder level (10).
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
