import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WeeklyReport {
  week_number: number;
  week_date: string;
  total_items: number;
  total_previous: number;
  total_sold: number;
  total_available: number;
}

export default function Reports() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [selectedWarehouse]);

  const loadReports = async () => {
    setLoading(true);
    let query = supabase.from('warehouse_items').select('*');

    if (selectedWarehouse !== 'all') {
      query = query.eq('warehouse_name', selectedWarehouse);
    }

    const { data, error } = await query;

    if (!error && data) {
      const weekMap = new Map<number, WeeklyReport>();

      data.forEach((item) => {
        if (!weekMap.has(item.week_number)) {
          weekMap.set(item.week_number, {
            week_number: item.week_number,
            week_date: item.week_date,
            total_items: 0,
            total_previous: 0,
            total_sold: 0,
            total_available: 0,
          });
        }
        const report = weekMap.get(item.week_number)!;
        report.total_items += 1;
        report.total_previous += item.previous_stock;
        report.total_sold += item.sold_out;
        report.total_available += item.available_stock || 0;
      });

      const sortedReports = Array.from(weekMap.values()).sort(
        (a, b) => b.week_number - a.week_number
      );
      setReports(sortedReports);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View historical data and weekly summaries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Reports</CardTitle>
          <CardDescription>Filter by warehouse to see detailed breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="Nsakena">Nsakena</SelectItem>
                <SelectItem value="Yellow Sack">Yellow Sack</SelectItem>
                <SelectItem value="Dossia">Dossia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : reports.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No reports available. Start tracking inventory in your warehouses.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Week</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold">Previous Stock</TableHead>
                    <TableHead className="font-semibold">Sold Out</TableHead>
                    <TableHead className="font-semibold">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow
                      key={report.week_number}
                      className={index % 2 === 0 ? 'bg-secondary/20' : ''}
                    >
                      <TableCell className="font-medium">Week {report.week_number}</TableCell>
                      <TableCell>
                        {new Date(report.week_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{report.total_items}</TableCell>
                      <TableCell>{report.total_previous}</TableCell>
                      <TableCell>{report.total_sold}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {report.total_available}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
