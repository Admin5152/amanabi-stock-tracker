import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Warehouse, BarChart3, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-secondary/50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-primary to-accent p-4">
              <Warehouse className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            AMANABi ENT
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Professional Warehouse Stock Management System
          </p>
          <p className="mb-12 text-lg text-muted-foreground">
            Track inventory, manage weekly sales, and generate reports across multiple warehouse
            locations with ease.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 bg-gradient-to-r from-primary to-accent text-lg"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Multi-Warehouse</h3>
            <p className="text-muted-foreground">
              Manage inventory across Nsakena, Yellow Sack, and Dossia warehouses from one
              centralized platform.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Weekly Tracking</h3>
            <p className="text-muted-foreground">
              Record sales data weekly with automatic calculations for available stock and
              comprehensive totals.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Secure Access</h3>
            <p className="text-muted-foreground">
              Member-only authentication ensures your inventory data is protected and accessible
              only to authorized users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
