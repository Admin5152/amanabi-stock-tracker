import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Settings as SettingsIcon, Database, Save, Users } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
  });
  const [userRole, setUserRole] = useState('employee');
  const [preferences, setPreferences] = useState({
    defaultWarehouse: '',
    currencySymbol: 'GHS',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || user.email || '',
      });
    } else {
      setProfile({
        full_name: '',
        email: user.email || '',
      });
    }

    // Load user role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roles && roles.length > 0) {
      setUserRole(roles[0].role);
    }

    // Load activity logs (for admins/managers)
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) {
      setActivityLogs(logs);
    }

    // Load users list (for admins)
    const { data: profilesList } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    if (profilesList) {
      const usersWithRoles: UserWithRole[] = [];
      for (const p of profilesList) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', p.id)
          .maybeSingle();
        
        usersWithRoles.push({
          id: p.id,
          email: p.email || '',
          full_name: p.full_name || '',
          role: roleData?.role || 'employee',
        });
      }
      setUsers(usersWithRoles);
    }

    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    }

    setSaving(false);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    toast({
      title: 'Data Cleared',
      description: 'Local storage data has been cleared.',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system preferences and view activity history</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-muted/20"
                    >
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Settings */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant="outline" className="uppercase">
                      {userRole}
                    </Badge>
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultWarehouse">Default Warehouse View</Label>
                  <Input
                    id="defaultWarehouse"
                    value={preferences.defaultWarehouse}
                    onChange={(e) => setPreferences({ ...preferences, defaultWarehouse: e.target.value })}
                    placeholder="Enter default warehouse"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={preferences.currencySymbol}
                    onChange={(e) => setPreferences({ ...preferences, currencySymbol: e.target.value })}
                    placeholder="GHS"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  Auto-Saved
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Clear local storage data if you are experiencing issues or want to reset the demo.
              </p>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={clearLocalStorage}>
                Reset Application Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
                    >
                      <div>
                        <p className="font-medium">{u.full_name || 'Unnamed User'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'manager' ? 'secondary' : 'outline'} className="uppercase">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
