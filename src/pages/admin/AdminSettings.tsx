import { useState } from 'react';
import { db, AuthStore } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  const user = AuthStore.getUser();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    await db.profiles.update(user.id, { full_name: fullName, email });
    const updated = await db.profiles.get(user.id);
    if (updated) {
      localStorage.setItem('mock_user', JSON.stringify(updated));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDB = async () => {
    if (confirm('This will delete ALL data and reseed the database. Continue?')) {
      await db.delete();
      localStorage.removeItem('mock_user');
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Settings</h1>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">SAVE CHANGES</Button>
            {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-red-900/50 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-red-400 uppercase tracking-tight">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-sm text-slate-400">Reset the entire database to its initial demo state. This cannot be undone.</p>
          <Button onClick={handleResetDB} className="bg-red-600 hover:bg-red-500 text-white font-bold">RESET DATABASE</Button>
        </CardContent>
      </Card>
    </div>
  );
}
