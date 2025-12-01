import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Warehouse, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, confirmPassword, fullName });
        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: 'Sign Up Failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success!',
            description: 'Your account has been created. You can now log in.',
          });
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Real-time Multi-warehouse Tracking',
    'Automated Stock Calculations',
    'Debtor & Sales Management',
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Blue Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AMANABI ENT.</h1>
              <p className="text-sm text-white/70 tracking-wide">CLOTHING INVENTORY</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Manage your stock<br />
            with precision & ease.
          </h2>

          {/* Description */}
          <p className="text-white/80 text-lg mb-10 max-w-md leading-relaxed">
            The complete solution for tracking inventory across Nsakena, Viv, and Yellow Sack warehouses. Real-time insights for smarter business decisions.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-700" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AMANABI ENT.</h1>
              <p className="text-xs text-muted-foreground">CLOTHING INVENTORY</p>
            </div>
          </div>
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Please enter your credentials to access the portal.'
                : 'Get started with your warehouse management.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="h-12 bg-background border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-background border-border pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                  className="h-12 bg-background border-border"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base gap-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
