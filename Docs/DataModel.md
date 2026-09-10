# データモデル（Supabase Postgres）

テーブルはアプリ用スキーマ `public`。RLS は有効にするが、書き込みの正はサーバ（service role）。anon の直接書き込みは禁止。ポリシーを置かないため Advisor に INFO が出るが、意図どおり。

## events

開催。1行が1日の出張。

| 列 | 型 | 制約 |
| --- | --- | --- |
| id | uuid | PK、default `gen_random_uuid()` |
| date | date | not null。開催日（JST の暦日） |
| start_time | time | not null |
| end_time | time | not null |
| slot_minutes | integer | not null、> 0 |
| break_minutes | integer | not null、>= 0 |
| public_token | text | not null、unique |
| created_at | timestamptz | not null、default now() |

チェック: `end_time > start_time`。

## slots

開催作成時にまとめて insert する。あとから行を増やさない。

| 列 | 型 | 制約 |
| --- | --- | --- |
| id | uuid | PK |
| event_id | uuid | not null、FK events ON DELETE CASCADE |
| starts_at | timestamptz | not null |
| ends_at | timestamptz | not null |
| sort_index | integer | not null |

`UNIQUE (event_id, starts_at)`。  
`starts_at` / `ends_at` は `date + time` を `Asia/Tokyo` として保存する。

## bookings

| 列 | 型 | 制約 |
| --- | --- | --- |
| id | uuid | PK |
| slot_id | uuid | not null、FK slots ON DELETE CASCADE |
| event_id | uuid | not null、FK events ON DELETE CASCADE |
| company_name | text | not null |
| guest_name | text | not null |
| email | text | not null（保存時は小文字） |
| created_at | timestamptz | not null、default now() |
| cancelled_at | timestamptz | null なら有効 |

有効予約だけを対象にするユニーク制約（部分インデックス）:

```sql
CREATE UNIQUE INDEX bookings_one_per_slot
  ON bookings (slot_id)
  WHERE cancelled_at IS NULL;

CREATE UNIQUE INDEX bookings_one_email_per_event
  ON bookings (event_id, email)
  WHERE cancelled_at IS NULL;
```

これで同時予約の二重取りを DB が落とす。

## 管理者

別テーブルは作らない。Supabase Auth のユーザーが管理者。  
「登録済みが0人か」は Admin API または `auth.users` をサーバから数えて判定する。

## 画面用の読み方

- 開催一覧: `events` を `date desc, start_time desc`
- 予約ボード: `slots` を `sort_index` 順に読み、有効 `bookings` を LEFT JOIN
- 公開予約画面: `public_token` で `events` を引き、同様にコマ＋予約有無（名前は出さない。埋まっているかどうかだけ）
