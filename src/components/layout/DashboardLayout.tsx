import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, BarChart3, Warehouse, Home } from 'lucide-react';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Nsakena', href: '/warehouse/nsakena', icon: Warehouse },
    { name: 'Yellow Sack', href: '/warehouse/yellow-sack', icon: Warehouse },
    { name: 'Dossia', href: '/warehouse/dossia', icon: Warehouse },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-2 border-border/50 bg-gradient-to-b from-card via-card/95 to-card/90 shadow-[4px_0_15px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b-2 border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 px-6">
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-bold text-transparent animate-fade-in">
            AMANABi ENT
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg scale-105'
                    : 'text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:scale-102'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t-2 border-border/50 bg-gradient-to-b from-transparent to-secondary/20 p-4">
          <div className="mb-3 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Logged in as</p>
            <p className="truncate text-sm font-medium">{user?.email}</p>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full justify-start gap-2 border-2 transition-all hover:border-primary/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'lg:pl-64' : 'pl-0'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b-2 border-border/50 bg-gradient-to-r from-card/95 to-card/90 px-6 shadow-sm backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="transition-all hover:bg-primary/10 hover:scale-110"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
