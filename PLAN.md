# 茶道具管理アプリ 再構築計画

## プロジェクト概要

茶道具管理Webアプリの再構築。既存アプリ（Express + Vanilla JS）をモダンなスタックに移行し、画像管理の改善とコードの整理を行う。

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Vite + React |
| 言語 | TypeScript |
| 認証・DB・ストレージ | Supabase |
| デプロイ | Vercel |

---

## 機能要件

### 認証
- ユーザー登録（ユーザーネーム＋パスワード）
- ログイン・ログアウト
- ゲストログイン（Supabase Anonymous Auth）
- ゲストは閲覧のみ可能（登録・編集・削除は不可）

### アイテム管理（登録ユーザーのみ）
- アイテム登録
  - 名称（必須）
  - 作者
  - 窯元・作元
  - 区分（茶道具カテゴリのプルダウン）
  - 備考
  - 写真（最大5枚、Supabase Storageにアップロード）
  - 公開/非公開フラグ
- アイテム編集（自分のアイテムのみ）
  - 既存の写真を維持しつつ追加・削除可能
- アイテム削除（自分のアイテムのみ）
  - 削除時はStorageの画像ファイルも合わせて削除
- 自分のアイテム一覧表示

### 閲覧
- 公開アイテムの一覧表示（全ユーザー分）

### エクスポート
- 自分のアイテムをCSVダウンロード（クライアントサイドで生成）

---

## 非機能要件

- **セキュリティ**：Supabase RLS（Row Level Security）で自分のデータのみ操作可能にする
- **画像容量**：Supabase Storage（無料枠2GB）を使用。Base64のDB保存は廃止
- **レスポンシブ**：スマートフォンでも使いやすいUI

---

## DBスキーマ（Supabase / PostgreSQL）

### `profiles`テーブル
Supabase Authと連携するユーザー情報。

| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid | auth.users.id と紐付け（PK） |
| username | text | ユーザー名 |
| created_at | timestamp | |

### `items`テーブル

| カラム | 型 | 備考 |
|--------|-----|------|
| id | serial | PK |
| user_id | uuid | profiles.id と紐付け |
| name | text | 必須 |
| author | text | 作者 |
| kiln | text | 窯元・作元 |
| category | text | 区分 |
| description | text | 備考 |
| is_public | boolean | デフォルト true |
| created_at | timestamp | |

### `item_images`テーブル
1アイテムにつき最大5枚の画像を管理。

| カラム | 型 | 備考 |
|--------|-----|------|
| id | serial | PK |
| item_id | integer | items.id と紐付け |
| image_url | text | Supabase Storage の URL |
| order | integer | 表示順（0〜4） |
| created_at | timestamp | |

---

## 現行からの変更点

| 項目 | 現行 | 新規 |
|------|------|------|
| バックエンド | Express.js | 不要（Supabase） |
| 言語 | JavaScript | TypeScript |
| 認証 | bcrypt 自前実装 | Supabase Auth |
| 画像保存 | Base64 を DB に保存 | Supabase Storage（URL のみ DB に保存） |
| 画像枚数 | 1枚 | 最大5枚 |
| フロントエンド | Vanilla HTML/JS | Vite + React |
| デプロイ | Render | Vercel |
| DB アクセス制御 | サーバー側のみ | RLS（DB 側で制御） |
| マイグレーション URL | 残存 | 廃止 |
