-- Authentication is handled by Supabase Auth (auth.users)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAYERS TABLE
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    real_name TEXT,
    discord TEXT,
    telegram TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEALS TABLE
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    backer_share DECIMAL NOT NULL DEFAULT 50 CHECK (backer_share >= 0 AND backer_share <= 100),
    player_share DECIMAL NOT NULL DEFAULT 50 CHECK (player_share >= 0 AND player_share <= 100),
    makeup_enabled BOOLEAN NOT NULL DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (backer_share + player_share = 100)
);

-- STAKE LEVELS TABLE
CREATE TABLE stake_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    small_blind DECIMAL NOT NULL,
    big_blind DECIMAL NOT NULL,
    max_buyin DECIMAL NOT NULL,
    required_bankroll DECIMAL NOT NULL,
    move_up_threshold DECIMAL,
    move_down_threshold DECIMAL,
    max_tables INTEGER DEFAULT 4,
    stop_loss DECIMAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAYER STAKES TABLE
CREATE TABLE player_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    stake_level_id UUID REFERENCES stake_levels(id) ON DELETE CASCADE,
    approved BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    current_primary_stake BOOLEAN DEFAULT false,
    UNIQUE(player_id, stake_level_id)
);

-- STAKE HISTORY TABLE
CREATE TABLE stake_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    old_stake_id UUID REFERENCES stake_levels(id),
    new_stake_id UUID REFERENCES stake_levels(id),
    reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SESSIONS TABLE
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    site TEXT NOT NULL,
    game_format TEXT NOT NULL,
    stake_level_id UUID REFERENCES stake_levels(id),
    buy_in DECIMAL NOT NULL DEFAULT 0,
    cash_out DECIMAL NOT NULL DEFAULT 0,
    rakeback DECIMAL NOT NULL DEFAULT 0,
    bonus DECIMAL NOT NULL DEFAULT 0,
    profit DECIMAL NOT NULL, 
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MAKEUP HISTORY TABLE
CREATE TABLE makeup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    old_makeup DECIMAL NOT NULL,
    new_makeup DECIMAL NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SETTLEMENTS TABLE
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    amount_backer DECIMAL NOT NULL,
    amount_player DECIMAL NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BANKROLL TRANSACTIONS TABLE
CREATE TABLE bankroll_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'adjustment')),
    amount DECIMAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Admins can read all, players can read their own
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can update profiles" ON profiles FOR ALL USING (is_admin());

-- Players: Admins can all, player can read their own mapped profile
CREATE POLICY "Admins can all players" ON players FOR ALL USING (is_admin());
CREATE POLICY "Player can read own data" ON players FOR SELECT USING (profile_id = auth.uid());

-- Deals: Admin all, Player read own
CREATE POLICY "Admins can all deals" ON deals FOR ALL USING (is_admin());
CREATE POLICY "Player can read own deals" ON deals FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Stake Levels: All authenticated users can read. Admins can edit.
CREATE POLICY "All users can read stake levels" ON stake_levels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can edit stake levels" ON stake_levels FOR ALL USING (is_admin());

-- Sessions: Admin all, Player read/insert own
CREATE POLICY "Admins can all sessions" ON sessions FOR ALL USING (is_admin());
CREATE POLICY "Player can read own sessions" ON sessions FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);
CREATE POLICY "Player can insert own sessions" ON sessions FOR INSERT WITH CHECK (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Bankroll Transactions: Admin all, Player read own
CREATE POLICY "Admins can all bankroll" ON bankroll_transactions FOR ALL USING (is_admin());
CREATE POLICY "Player can read own bankroll" ON bankroll_transactions FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

-- Makeup, Settlements, Stake History: Admin all, Player read own
-- (Omitted here for brevity, follows same pattern as Bankroll)
CREATE POLICY "Admins can all makeup" ON makeup_history FOR ALL USING (is_admin());
CREATE POLICY "Player can read own makeup" ON makeup_history FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

CREATE POLICY "Admins can all settlements" ON settlements FOR ALL USING (is_admin());
CREATE POLICY "Player can read own settlements" ON settlements FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
);

CREATE POLICY "Admins can all audit logs" ON audit_logs FOR ALL USING (is_admin());
