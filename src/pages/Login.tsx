import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthStore, type Profile } from '../lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spade } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (u: Profile) => void }) {
  const [email, setEmail] = useState('admin@backer.com');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = await AuthStore.login(email);
    if (user) {
      onLogin(user);
      navigate(user.role === 'admin' ? '/admin' : '/player');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-slate-200">
        <CardHeader className="space-y-1 justify-center items-center">
          <div className="h-12 w-12 rounded bg-emerald-500 flex items-center justify-center mb-2">
            <Spade className="h-6 w-6 text-slate-900" />
          </div>
          <CardTitle className="text-2xl font-bold text-white tracking-tight uppercase">Staking Manager</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email (Demo: admin@backer.com or player@grinder.com)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input 
                id="password" 
                type="password"
                value="demo-password"
                readOnly
                className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500 text-slate-500"
              />
              <p className="text-xs text-slate-500">Demo accounts do not require a real password.</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">
              SIGN IN
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
