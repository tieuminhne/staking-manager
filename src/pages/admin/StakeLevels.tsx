import type React from 'react';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type StakeLevel } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency as formatC } from '@/lib/utils';
import { X } from 'lucide-react';

export default function StakeLevels() {
  const stakes = useLiveQuery(() => db.stakeLevels.toArray(), []) || [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StakeLevel | null>(null);
  const [name, setName] = useState('');
  const [maxBuyin, setMaxBuyin] = useState('');

  const resetForm = () => {
    setName(''); setMaxBuyin('');
    setEditing(null); setShowForm(false);
  };

  const openEdit = (s: StakeLevel) => {
    setEditing(s);
    setName(s.name);
    setMaxBuyin(String(s.max_buyin));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const buyin = parseFloat(maxBuyin) || 0;
    const data = {
      name,
      small_blind: 0,
      big_blind: 0,
      max_buyin: buyin,
      required_bankroll: 0,
    };
    if (editing) {
      await db.stakeLevels.update(editing.id, data);
    } else {
      await db.stakeLevels.add({ id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this stake level?')) {
      await db.playerStakes.where('stake_level_id').equals(id).delete();
      await db.stakeLevels.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Stake Levels</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">
          + ADD STAKE
        </button>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">{editing ? 'Edit' : 'New'} Stake</CardTitle>
            <button onClick={resetForm}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. NL50" className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Buy-in ($)</Label>
                  <Input type="number" step="0.01" value={maxBuyin} onChange={e => setMaxBuyin(e.target.value)} required placeholder="e.g. 50" className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" />
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">
                {editing ? 'UPDATE' : 'CREATE'} STAKE
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">All Stakes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Buy-in</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakes.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-slate-500 h-24">No stakes defined.</TableCell></TableRow>
              ) : (
                stakes.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-white">{s.name}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(s.max_buyin)}</TableCell>
                    <TableCell className="text-right space-x-3">
                      <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
