import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, LayoutDashboard, Package, Warehouse, BarChart3, Settings } from 'lucide-react';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>('employee');
  const [userName, setUserName] = useState<string>('');
  const location = useLocation();
  const { signOut, user } = useAuth();

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;
      
      // Get user role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (roles && roles.length > 0) {
        setUserRole(roles[0].role);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      } else {
        setUserName(user.email?.split('@')[0] || 'User');
      }
    };

    loadUserInfo();
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'All Inventory', href: '/reports', icon: Package },
    { name: 'Nsakena', href: '/warehouse/nsakena', icon: Warehouse },
    { name: 'Viv Warehouse', href: '/warehouse/viv', icon: Warehouse },
    { name: 'Yellow Sack Whse', href: '/warehouse/yellow-sack', icon: Warehouse },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Warehouse className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AMANABI</h1>
            <p className="text-xs font-medium text-emerald-500">CLOTHING ENT.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href.startsWith('/warehouse') && location.pathname.startsWith('/warehouse') && item.href === location.pathname);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-border p-4">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Signed in as:</p>
            <p className="font-semibold text-foreground">{userName}</p>
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            AMANABI Clothing Inventory
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
