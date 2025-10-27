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
      <div className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-primary to-accent p-4 shadow-glow animate-scale-in">
              <Warehouse className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-6xl animate-fade-in">
            AMANABi ENT.
          </h1>
          <p className="mb-8 text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
            Professional Warehouse Stock Management System
          </p>
          <p className="mb-12 text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
            Track inventory, manage weekly sales, and generate reports across multiple warehouse
            locations with ease.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 bg-gradient-to-r from-primary to-accent text-lg shadow-glow transition-all hover:shadow-[0_0_40px_hsl(221_83%_53%/0.3)] hover:scale-105"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="group rounded-xl border-2 border-border/50 bg-gradient-to-br from-card to-card/80 p-6 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow hover:scale-105 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Multi-Warehouse
            </h3>
            <p className="text-muted-foreground">
              Manage inventory across Nsakena, Yellow Sack, and Dossia warehouses from one
              centralized platform.
            </p>
          </div>

          <div className="group rounded-xl border-2 border-border/50 bg-gradient-to-br from-card to-card/80 p-6 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow hover:scale-105 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Weekly Tracking
            </h3>
            <p className="text-muted-foreground">
              Record sales data weekly with automatic calculations for available stock and
              comprehensive totals.
            </p>
          </div>

          <div className="group rounded-xl border-2 border-border/50 bg-gradient-to-br from-card to-card/80 p-6 shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow hover:scale-105 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Secure Access
            </h3>
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
