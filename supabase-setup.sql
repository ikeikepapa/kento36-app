-- ==========================================
-- KENTO36 レベルUPアプリ：Supabase テーブル作成SQL
-- ==========================================
-- このSQLを Supabase の SQL Editor に貼り付けて実行してください。
-- 手順：Supabase管理画面 → 左メニュー「SQL Editor」→ 「New Query」→ 貼り付け → 「Run」
-- ==========================================

-- 練習記録テーブル
CREATE TABLE entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  swings INTEGER DEFAULT 0,
  pitches INTEGER DEFAULT 0,
  bc_at_bats INTEGER DEFAULT 0,
  bc_hits INTEGER DEFAULT 0,
  game_at_bats INTEGER DEFAULT 0,
  game_hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- date カラムにインデックスを作成（検索を高速化）
CREATE INDEX idx_entries_date ON entries(date);

-- RLS（Row Level Security）を無効にする
-- ※ 家族専用アプリのため、認証なしで全データにアクセス可能にします
-- ※ 将来的にログイン機能を追加する場合は、ここを変更します
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 全員がアクセスできるポリシーを作成
CREATE POLICY "Allow all access" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
