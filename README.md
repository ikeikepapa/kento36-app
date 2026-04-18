# 👦KENTO36🔥レベルUPアプリ🔥

野球練習トラッキングアプリ。素振り・投球・バッセン・試合の記録を管理し、レベルアップしていくアプリです。

## 🚀 デプロイ手順

### Step 1：Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) にアクセスしてアカウント作成（GitHubログイン可）
2. 「New Project」をクリック
3. 以下を入力：
   - **Name**: `kento36-app`
   - **Database Password**: 好きなパスワード（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)`
4. 「Create new project」をクリック（1〜2分待つ）

### Step 2：データベースのテーブルを作成

1. Supabase 管理画面の左メニューから「**SQL Editor**」をクリック
2. 「**New Query**」をクリック
3. `supabase-setup.sql` ファイルの中身をすべてコピーして貼り付け
4. 「**Run**」ボタンをクリック
5. 「Success」と表示されればOK

### Step 3：API キーをメモする

1. 左メニューの「**Project Settings**」（歯車アイコン）をクリック
2. 「**API**」をクリック
3. 以下の2つをコピーしてメモ帳に保存：
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon / public key**: `eyJhbGci...`（長い文字列）

### Step 4：GitHub にリポジトリを作成

1. [github.com](https://github.com) にログイン
2. 右上の「+」→「New repository」
3. Repository name: `kento36-app`
4. 「Create repository」をクリック

### Step 5：コードを GitHub にアップロード

**GitHub Desktop を使う場合（おすすめ）：**
1. [GitHub Desktop](https://desktop.github.com) をダウンロード・インストール
2. 「File」→「Add Local Repository」で、このフォルダを選択
3. 変更をすべてコミット（Summary に「初回デプロイ」と入力）
4. 「Publish repository」をクリック

**コマンドラインの場合：**
```bash
cd kento36-app
git init
git add .
git commit -m "初回デプロイ"
git remote add origin https://github.com/あなたのユーザー名/kento36-app.git
git push -u origin main
```

### Step 6：Vercel でデプロイ

1. [vercel.com](https://vercel.com) にアクセスし、GitHubアカウントでログイン
2. 「**Add New... → Project**」をクリック
3. `kento36-app` リポジトリを選んで「**Import**」
4. **Environment Variables** のセクションで以下を追加：

   | NAME | VALUE |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Step 3 でメモした Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 3 でメモした anon key |

5. 「**Deploy**」をクリック
6. 2〜3分待つとデプロイ完了！🎉

### Step 7：動作確認

1. Vercel が表示する URL（例：`kento36-app.vercel.app`）にアクセス
2. 適当にデータを入力してみる
3. ブラウザを閉じて再度開き、データが残っていればOK
4. 別のデバイス（スマホなど）からも同じURLでアクセスして確認

---

## 📁 ファイル構成

```
kento36-app/
├── app/
│   ├── layout.js        ← アプリの外枠（タイトルなど）
│   └── page.js          ← アプリ本体（メインのコード）
├── lib/
│   ├── supabase.js      ← Supabase への接続設定
│   └── useEntries.js    ← データの読み書きを行うフック
├── .env.local.example   ← 環境変数のテンプレート
├── .gitignore           ← Git にアップしないファイルの指定
├── next.config.mjs      ← Next.js の設定
├── package.json         ← 使用ライブラリの一覧
├── supabase-setup.sql   ← Supabase のテーブル作成SQL
└── README.md            ← このファイル
```
