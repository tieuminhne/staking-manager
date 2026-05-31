import type React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { db, type Profile, type StakeLevel } from '@/lib/db';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';

export default function NewSession({ user }: { user: Profile }) {
  const navigate = useNavigate();
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);

  const approvedStakes = useLiveQuery(async () => {
    if (!player) return [];
    const stakes = await db.playerStakes.where('player_id').equals(player.id).and(s => s.approved).toArray();
    const stakeLevels = await Promise.all(stakes.map(s => db.stakeLevels.get(s.stake_level_id)));
    return stakeLevels.filter(Boolean) as StakeLevel[];
  }, [player?.id]) || [];

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [site, setSite] = useState('GGPoker');
  const [format, setFormat] = useState('Cash Game');
  const [stakeId, setStakeId] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [rakeback, setRakeback] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [sessionNotes, setSessionNotes] = useState('');
  const [error, setError] = useState('');

  const selectedStake = approvedStakes.find(s => s.id === stakeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    if (!stakeId) {
      setError('Please select a stake level');
      return;
    }

    const b = parseFloat(buyIn) || 0;
    const c = parseFloat(cashOut) || 0;
    const r = parseFloat(rakeback) || 0;
    const bon = parseFloat(bonus) || 0;

    if (selectedStake && b > selectedStake.max_buyin) {
      setError(`Buy-in exceeds max allowed (${selectedStake.max_buyin}) for ${selectedStake.name}`);
      return;
    }

    if (selectedStake?.stop_loss) {
      const todaySessions = await db.sessions.where('player_id').equals(player.id).toArray();
      const todayFiltered = todaySessions.filter(s => s.date === date && s.stake_level_id === stakeId);
      const todayLosses = todayFiltered.filter(s => s.profit < 0).length;
      if (todayLosses >= selectedStake.stop_loss) {
        setError(`Stop-loss reached! Max ${selectedStake.stop_loss} losing sessions per day at this stake.`);
        return;
      }
    }

    const profit = c - b + r + bon;

    await db.sessions.add({
      id: crypto.randomUUID(),
      player_id: player.id,
      date,
      start_time: startTime,
      end_time: endTime,
      site,
      game_format: format,
      stake_level_id: stakeId,
      buy_in: b,
      cash_out: c,
      rakeback: r,
      bonus: bon,
      profit,
      notes: sessionNotes || undefined,
      created_at: new Date().toISOString()
    });

    navigate('/player');
  };

  if (!player) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase mb-6">Log New Session</h1>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-800 border-slate-700 text-white rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
             <CardTitle className="text-sm font-bold uppercase tracking-tight">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">

            {error && <div className="p-3 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Date</Label>
                 <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-2">
                   <Label className="text-[10px] uppercase font-bold text-slate-400">Start</Label>
                   <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] uppercase font-bold text-slate-400">End</Label>
                   <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Site</Label>
                 <select value={site} onChange={(e) => setSite(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <option>WPT Global</option>
                    <option>GGPoker</option>
                    <option>PokerStars</option>
                    <option>ACR</option>
                    <option>CoinPoker</option>
                    <option>Natural8</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Format</Label>
                 <select value={format} onChange={(e) => setFormat(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <option>Cash Game</option>
                    <option>Rush &amp; Cash</option>
                    <option>Zoom</option>
                 </select>
               </div>
            </div>

            <div className="space-y-2">
               <Label className="text-[10px] uppercase font-bold text-slate-400">Stake Level</Label>
               <select value={stakeId} onChange={(e) => { setStakeId(e.target.value); setError(''); }} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                 <option value="">-- Select Approved Stake --</option>
                 {approvedStakes.map(st => (
                   <option key={st.id} value={st.id}>{st.name} (Max Buy-in: ${st.max_buyin})</option>
                 ))}
               </select>
               {approvedStakes.length === 0 && <p className="text-[10px] text-red-500 mt-1 font-bold">You are not approved for any stakes yet.</p>}
               {selectedStake?.stop_loss && <p className="text-[10px] text-slate-500 mt-1">Stop-loss: {selectedStake.stop_loss} losing sessions/day</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-6">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Total Buy-in ($)</Label>
                 <Input type="number" step="0.01" value={buyIn} onChange={(e) => { setBuyIn(e.target.value); setError(''); }} required className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" placeholder="e.g. 200" />
                 {selectedStake && <p className="text-[10px] text-slate-500">Max: ${selectedStake.max_buyin}</p>}
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Total Cashing Out ($)</Label>
                 <Input type="number" step="0.01" value={cashOut} onChange={(e) => setCashOut(e.target.value)} required className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" placeholder="e.g. 450" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Rakeback ($)</Label>
                 <Input type="number" step="0.01" value={rakeback} onChange={(e) => setRakeback(e.target.value)} className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase font-bold text-slate-400">Bonus ($)</Label>
                 <Input type="number" step="0.01" value={bonus} onChange={(e) => setBonus(e.target.value)} className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" />
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Notes</Label>
              <Input value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Optional session notes" className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
            </div>

            {buyIn && cashOut && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Estimated Profit</p>
                <p className={`text-xl font-bold font-mono ${((parseFloat(cashOut) || 0) - (parseFloat(buyIn) || 0) + (parseFloat(rakeback) || 0) + (parseFloat(bonus) || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${((parseFloat(cashOut) || 0) - (parseFloat(buyIn) || 0) + (parseFloat(rakeback) || 0) + (parseFloat(bonus) || 0)).toFixed(2)}
                </p>
              </div>
            )}

          </CardContent>
          <CardFooter className="bg-slate-900/50 border-t border-slate-700 py-4">
            <Button type="submit" disabled={!stakeId} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/20">LOG SESSION</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
