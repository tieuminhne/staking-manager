import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency as formatC } from '@/lib/utils';

export default function PlayerHistory({ user }: { user: Profile }) {
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const sessions = useLiveQuery(async () => {
    if (!player) return [];
    const all = await db.sessions.where('player_id').equals(player.id).toArray();
    const withStake = await Promise.all(all.map(async (s) => {
      const stake = await db.stakeLevels.get(s.stake_level_id);
      return { ...s, stakeName: stake?.name || 'Unknown' };
    }));
    return withStake.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [player?.id]) || [];

  const filtered = sessions.filter(s => {
    if (filterSite && s.site !== filterSite) return false;
    if (filterMonth && !s.date.startsWith(filterMonth)) return false;
    return true;
  });

  const sites = [...new Set(sessions.map(s => s.site))];
  const months = [...new Set(sessions.map(s => s.date.substring(0, 7)))].sort().reverse();
  const totalProfit = filtered.reduce((a, s) => a + s.profit, 0);

  if (!player) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Session History</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Site</label>
          <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="flex h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <option value="">All Sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
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
          <p className="text-xs text-slate-400">Showing {filtered.length} sessions | Total: <span className={`font-mono font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(totalProfit)}</span></p>
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
                <TableHead>Site</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead className="text-right">Buy-in</TableHead>
                <TableHead className="text-right">Cash-out</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-500 h-24">No sessions found.</TableCell></TableRow>
              ) : (
                filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-slate-300">{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-white">{s.site}</TableCell>
                    <TableCell className="text-slate-400">{s.game_format}</TableCell>
                    <TableCell className="text-slate-400">{s.stakeName}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(s.buy_in)}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(s.cash_out)}</TableCell>
                    <TableCell className={`text-right font-mono font-medium ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.profit > 0 ? '+' : ''}{formatC(s.profit)}
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
