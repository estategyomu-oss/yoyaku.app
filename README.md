
# 社内・社外予約システム (Corporate Reservation System)

Next.js (App Router), TypeScript, Prisma, PostgreSQL で構築することを想定したフルスタック予約システムです。

## 技術スタック
- **Frontend**: Next.js, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, Prisma ORM
- **Infrastructure**: Docker Compose (PostgreSQL)

## セットアップ手順

1. **リポジトリの準備**
   ```bash
   npm install
   ```

2. **データベースの起動**
   ```bash
   # server/ ディレクトリ内の docker-compose.yml を使用
   docker compose up -d
   ```

3. **環境変数の設定**
   `.env.example` を `.env` にコピーし、必要に応じて編集します。

4. **データベースマイグレーション**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **初期ユーザーの作成**
   `npx prisma studio` または `ts-node` スクリプトを使用して以下のユーザーを作成してください。
   *パスワードは `sha256` でハッシュ化して保存してください。*

   | Email | Password (Raw) | Role | Company |
   |-------|----------------|------|---------|
   | admin@internal | password123 | admin | INTERNAL |
   | a@company | password123 | user | A |
   | b@company | password123 | user | B |

6. **アプリケーションの起動**
   ```bash
   npm run dev
   ```

## 実装のポイント
- **予約の競合防止**: DBレベルの `Unique` 制約（`slotId` および `company+date`）により、同一枠の二重予約や同一会社の1日複数予約を物理的に防いでいます。
- **RBAC**: ミドルウェアまたはAPIハンドラ冒頭でユーザーロールを確認し、管理機能へのアクセスを制限しています。
- **日付管理**: 全て `YYYY-MM-DD` 形式の文字列で統一し、タイムゾーンに依存しない一貫した比較を実現しています。

## デモ動作
このプレビュー環境では、`localStorage` を用いた MockDB で動作をシミュレートしています。
- ログイン後、管理者は「管理者」タブから日付を指定して枠を生成できます。
- ユーザーは「予約枠」タブから空き枠を予約できます。
- 既に予約された枠や、同じ日に既に予約がある場合はエラーが表示されます。
