import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, X } from 'lucide-react';
import { toast } from 'sonner';

interface AuthProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

export default function Auth({ onClose, onLogin }: AuthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Check for admin credentials
      if (loginData.email === 'admin@satishbioinformatics.com' && loginData.password === 'admin123') {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@satishbioinformatics.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isAdmin: true
        };
        onLogin(adminUser);
        toast.success('Welcome back, Admin!');
        onClose();
      } else if (loginData.email && loginData.password) {
        // Regular user login
        const user = {
          id: 'user-' + Date.now(),
          email: loginData.email,
          firstName: 'User',
          lastName: 'Name',
          role: 'user',
          isAdmin: false
        };
        onLogin(user);
        toast.success('Login successful!');
        onClose();
      } else {
        toast.error('Please enter valid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newUser = {
        id: 'user-' + Date.now(),
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: 'user',
        isAdmin: false
      };
      onLogin(newUser);
      toast.success('Registration successful!');
      onClose();
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="login-password">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Demo Admin Access:</strong><br />
                    Email: admin@satishbioinformatics.com<br />
                    Password: admin123
                  </AlertDescription>
                </Alert>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">
                      <User className="h-4 w-4 inline mr-1" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="register-email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-password">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}