# アーキテクチャ

## スタック

```
ブラウザ
  └ Next.js App Router (Vercel)
       ├ Server Actions / サーバコンポーネント
       ├ Supabase Auth（管理者セッション）
       ├ Supabase Postgres（開催・コマ・予約）
       └ Resend（予約・取消メール）
```

クライアントから Supabase に直接 INSERT しない。予約も開催作成もサーバ側で行う。

## ディレクトリ（予定）

```
app/
  page.tsx                          # トップ（管理ログインへ）
  layout.tsx
  login/page.tsx                    # 管理者ログイン
  signup/page.tsx                   # 初回管理者登録（0人のときだけ）
  admin/
    layout.tsx                      # 未ログインなら /login
    page.tsx                        # 開催一覧
    events/new/page.tsx             # 開催作成
    events/[id]/page.tsx            # 開催詳細・取消・URLコピー
  r/[token]/
    page.tsx                        # 予約画面
    complete/page.tsx               # 完了
lib/
  supabase/                         # サーバ用クライアント
  slots.ts                          # コマ生成
  booking.ts                        # 予約・取消のユースケース
  mail.ts                           # Resend
```

実装中に名前が多少変わってもよい。責務（生成 / 予約 / メール）は分けたままにする。

## 画面遷移

```
管理者:
  /signup（初回のみ） → /admin
  /login → /admin → /admin/events/new → /admin/events/[id]

予約者:
  /r/[token] → 送信成功 → /r/[token]/complete
```

## コマ生成

入力: 開始時刻 `S`、終了時刻 `E`、コマ分数 `D`、休憩分数 `B`。日付は開催日。タイムゾーンは `Asia/Tokyo`。

```
t = S
while t + D <= E:
  コマを1つ作る（start = t, end = t + D）
  t = t + D + B
```

例: 10:00〜12:00、D=20、B=5

| # | 開始 | 終了 |
| --- | --- | --- |
| 1 | 10:00 | 10:20 |
| 2 | 10:25 | 10:45 |
| 3 | 10:50 | 11:10 |
| 4 | 11:15 | 11:35 |
| 5 | 11:40 | 12:00 |

1コマも作れない入力（終了が開始より前、D が区間より長い等）は作成エラー。

生成後のコマの追加・削除・時刻変更はしない。

## 予約成立の条件（サーバで全部見る）

1. トークンに対応する開催がある
2. いまが開催開始日時より前
3. 指定コマがその開催に属し、有効な予約がまだない
4. その開催に、同じメール（正規化後）の有効予約がない
5. 会社名・名前・メールが空でない。メールは形式チェック

正規化: trim、メールは小文字化。

失敗時は予約画面に理由を返す。成功時だけメールを送る。メール送信失敗はログに残し、予約自体は消さない（画面には「予約は完了、メールが届かない場合は管理者へ」）。

## 取消

管理者のみ。`bookings.cancelled_at` を入れる。  
有効予約のユニーク制約から外れるので、同じコマ・同じメールで再予約できる。  
取消後に予約者・管理者へメール。

## 認可

| 操作 | 誰 |
| --- | --- |
| 開催 CRUD、予約取消、一覧 | ログイン済み管理者 |
| 予約の INSERT | 誰でも（トークン＋サーバ検証） |
| 予約者情報の閲覧 | 管理者のみ |

`signup` は `auth.users` が空のときだけ成功させる。

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
MAIL_FROM
NEXT_PUBLIC_APP_URL
```

`MAIL_FROM` は Resend で許可されたアドレス。  
`NEXT_PUBLIC_APP_URL` は予約 URL のコピーに使う。末尾スラッシュなし。

Vercel では Project Settings の Environment Variables に上記をすべて入れる。  
`NEXT_PUBLIC_*` はビルド時に埋め込まれるので、値を変えたら再デプロイする。  
`SUPABASE_SERVICE_ROLE_KEY` はサーバ専用。本番の `NEXT_PUBLIC_APP_URL` は公開サイトのオリジンにする。
