# ちょこっと整体 予約システム

出張整体向けの予約 Web。管理者が開催（日付・時間帯・コマ）を作り、ランダム URL を渡す。予約者はその URL から空きコマを1つ選ぶ。

## 開発

```bash
npm install
```

`.env.example` を `.env.local` にコピーし、実値を入れてから:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く。初回だけ `/signup` で管理者を1人作る。

```bash
npm test
npm run lint
```

仕様は [`Docs/README.md`](./Docs/README.md) を正とする。

## 環境変数

| 名前 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（ブラウザ用。DB への直接書き込みには使わない） |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバ専用。開催・予約の読み書きと管理者ユーザー操作 |
| `RESEND_API_KEY` | 予約・取消メール |
| `MAIL_FROM` | Resend で許可された From（例: `名前 <you@example.com>`） |
| `NEXT_PUBLIC_APP_URL` | 予約 URL のコピーに使うオリジン。末尾スラッシュなし |

`SUPABASE_SERVICE_ROLE_KEY` はクライアントのコードに出さない。

## Vercel

1. このリポジトリを Import する。
2. Project Settings → Environment Variables に上表をすべて入れる（Production / Preview とも）。
3. Production の `NEXT_PUBLIC_APP_URL` は公開 URL（例: `https://example.vercel.app`）。
4. `NEXT_PUBLIC_*` を変えたあとは再デプロイする（ビルド時に埋め込まれるため）。
