import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AuthStore, type Profile } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency as formatC } from '@/lib/utils';

export default function PlayerProfile({ user }: { user: Profile }) {
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);
  const deal = useLiveQuery(() => player ? db.deals.where('player_id').equals(player.id).first() : undefined, [player?.id]);
  const approvedStakes = useLiveQuery(async () => {
    if (!player) return [];
    const stakes = await db.playerStakes.where('player_id').equals(player.id).and(s => s.approved).toArray();
    const levels = await Promise.all(stakes.map(s => db.stakeLevels.get(s.stake_level_id)));
    return levels.filter(Boolean);
  }, [player?.id]) || [];

  const [fullName, setFullName] = useState(user.full_name);
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [saved, setSaved] = useState(false);

  useLiveQuery(async () => {
    if (player) {
      setDiscord(player.discord || '');
      setTelegram(player.telegram || '');
    }
  }, [player?.id]);

  const handleSave = async () => {
    if (!player) return;
    await db.profiles.update(user.id, { full_name: fullName });
    await db.players.update(player.id, { real_name: fullName, discord, telegram });
    const updated = await db.profiles.get(user.id);
    if (updated) localStorage.setItem('mock_user', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!player) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">My Profile</h1>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Nickname</Label>
              <Input value={player.nickname} disabled className="bg-slate-900 border-slate-700 text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Discord</Label>
              <Input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#1234" className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Telegram</Label>
              <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Email</Label>
            <Input value={user.email} disabled className="bg-slate-900 border-slate-700 text-slate-500" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">SAVE CHANGES</Button>
            {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
          </div>
        </CardContent>
      </Card>

      {deal && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">My Deal</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Backer Share</p>
                <p className="text-xl font-bold text-white">{deal.backer_share}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Player Share</p>
                <p className="text-xl font-bold text-emerald-400">{deal.player_share}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Makeup</p>
                <p className="text-xl font-bold text-white">{deal.makeup_enabled ? 'ON' : 'OFF'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Start: {new Date(deal.start_date).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

      {approvedStakes.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Approved Stakes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {approvedStakes.map(s => s && (
                <div key={s.id} className="flex justify-between items-center bg-slate-900 rounded p-3 border border-slate-700">
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="text-slate-400 text-sm font-mono">${s.small_blind}/${s.big_blind} | Max: {formatC(s.max_buyin)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
