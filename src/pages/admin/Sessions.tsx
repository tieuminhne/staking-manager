import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency as formatC } from '@/lib/utils';

export default function Sessions() {
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const players = useLiveQuery(() => db.players.toArray(), []) || [];

  const sessions = useLiveQuery(async () => {
    const s = await db.sessions.orderBy('date').reverse().toArray();
    const enhanced = await Promise.all(s.map(async (session) => {
      const player = await db.players.get(session.player_id);
      const stake = await db.stakeLevels.get(session.stake_level_id);
      return { ...session, playerNickname: player?.nickname || 'Unknown', stakeName: stake?.name || '-' };
    }));
    return enhanced;
  }, []) || [];

  const filtered = sessions.filter(s => {
    if (filterPlayer && s.player_id !== filterPlayer) return false;
    if (filterMonth && !s.date.startsWith(filterMonth)) return false;
    return true;
  });

  const months = [...new Set(sessions.map(s => s.date.substring(0, 7)))].sort().reverse();
  const totalProfit = filtered.reduce((a, s) => a + s.profit, 0);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this session?')) {
      await db.sessions.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Sessions Ledger</h1>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Player</label>
          <select value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)} className="flex h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <option value="">All Players</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Month</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="flex h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <option value="">All Months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <p className="text-xs text-slate-400">
            {filtered.length} sessions | Total: <span className={`font-mono font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(totalProfit)}</span>
          </p>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">All Sessions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Site / Game</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead className="text-right">Buy In</TableHead>
                <TableHead className="text-right">Cash Out</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 h-24">No sessions recorded yet.</TableCell>
                </TableRow>
              ) : (
                filtered.map(session => (
                  <TableRow key={session.id}>
                    <TableCell className="text-slate-300">{new Date(session.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-white">{session.playerNickname}</TableCell>
                    <TableCell className="text-slate-300">{session.site} • {session.game_format}</TableCell>
                    <TableCell className="text-slate-400">{session.stakeName}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(session.buy_in)}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(session.cash_out)}</TableCell>
                    <TableCell className={`text-right font-medium font-mono ${session.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {session.profit > 0 ? '+' : ''}{formatC(session.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => handleDelete(session.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
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
