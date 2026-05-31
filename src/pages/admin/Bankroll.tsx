import type React from 'react';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency as formatC } from '@/lib/utils';
import { X } from 'lucide-react';

export default function Bankroll() {
  const players = useLiveQuery(() => db.players.toArray(), []) || [];
  const transactions = useLiveQuery(async () => {
    const txs = await db.bankrollTransactions.toArray();
    const enhanced = await Promise.all(txs.map(async (tx) => {
      const player = await db.players.get(tx.player_id);
      return { ...tx, playerNickname: player?.nickname || 'Unknown' };
    }));
    return enhanced.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, []) || [];

  const [showForm, setShowForm] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'adjustment'>('deposit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((a, t) => a + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0);
  const totalAdjustments = transactions.filter(t => t.type === 'adjustment').reduce((a, t) => a + t.amount, 0);
  const balance = totalDeposits - totalWithdrawals + totalAdjustments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    await db.bankrollTransactions.add({
      id: crypto.randomUUID(),
      player_id: playerId,
      type,
      amount: parseFloat(amount) || 0,
      notes: notes || undefined,
      created_at: new Date().toISOString(),
    });
    setShowForm(false);
    setAmount('');
    setNotes('');
    setPlayerId('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await db.bankrollTransactions.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Bankroll Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">
          + ADD TRANSACTION
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Balance</p>
            <p className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(balance)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Deposits</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{formatC(totalDeposits)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Withdrawals</p>
            <p className="text-2xl font-bold font-mono text-red-400">{formatC(totalWithdrawals)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Adjustments</p>
            <p className="text-2xl font-bold font-mono text-blue-400">{formatC(totalAdjustments)}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">New Transaction</CardTitle>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Player</Label>
                  <select value={playerId} onChange={e => setPlayerId(e.target.value)} required className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <option value="">-- Select --</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Type</Label>
                  <select value={type} onChange={e => setType(e.target.value as 'deposit' | 'withdrawal' | 'adjustment')} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Amount ($)</Label>
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">ADD TRANSACTION</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-slate-500 h-24">No transactions.</TableCell></TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-slate-300">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-white">{tx.playerNickname}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                        tx.type === 'deposit' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                        tx.type === 'withdrawal' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                        'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      }`}>{tx.type.toUpperCase()}</span>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}{formatC(tx.amount)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{tx.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => handleDelete(tx.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
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
