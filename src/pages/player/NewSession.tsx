import type React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { db, type Profile } from '@/lib/db';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { formatCurrency as formatC } from '@/lib/utils';

export default function NewSession({ user }: { user: Profile }) {
  const navigate = useNavigate();
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);

  const stakeId = useLiveQuery(async () => {
    if (!player) return '';
    const stake = await db.playerStakes.where('player_id').equals(player.id).and(s => s.approved).first();
    return stake?.stake_level_id || '';
  }, [player?.id]) || '';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startBalance, setStartBalance] = useState('');
  const [endBalance, setEndBalance] = useState('');
  const [error, setError] = useState('');

  const profit = (parseFloat(endBalance) || 0) - (parseFloat(startBalance) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    const start = parseFloat(startBalance) || 0;
    const end = parseFloat(endBalance) || 0;

    if (!start && !end) {
      setError('Please enter balances');
      return;
    }

    await db.sessions.add({
      id: crypto.randomUUID(),
      player_id: player.id,
      date,
      start_time: '',
      end_time: '',
      site: 'WPT Global',
      game_format: 'Cash Game',
      stake_level_id: stakeId,
      buy_in: start,
      cash_out: end,
      rakeback: 0,
      bonus: 0,
      profit: end - start,
      created_at: new Date().toISOString()
    });

    navigate('/player');
  };

  if (!player) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase mb-6">Log Session</h1>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-800 border-slate-700 text-white rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
             <CardTitle className="text-sm font-bold uppercase tracking-tight">WPT Global - Cash Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">

            {error && <div className="p-3 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md text-sm">{error}</div>}

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Start Balance ($)</Label>
              <Input type="number" step="0.01" value={startBalance} onChange={(e) => { setStartBalance(e.target.value); setError(''); }} required className="bg-slate-900 border-slate-700 font-mono text-lg focus-visible:ring-emerald-500" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">End Balance ($)</Label>
              <Input type="number" step="0.01" value={endBalance} onChange={(e) => { setEndBalance(e.target.value); setError(''); }} required className="bg-slate-900 border-slate-700 font-mono text-lg focus-visible:ring-emerald-500" placeholder="0.00" />
            </div>

            {startBalance && endBalance && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Profit / Loss</p>
                <p className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profit >= 0 ? '+' : ''}{formatC(profit)}
                </p>
              </div>
            )}

          </CardContent>
          <CardFooter className="bg-slate-900/50 border-t border-slate-700 py-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/20">LOG SESSION</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
