# 100 DOORS &amp; RESORT &amp; GASTRONOMY — 祥瑞 ガストロノミー会員 LP

株式会社祥瑞（dhp都市開発グループ）による月額制ガストロノミー会員のランディングページ。
静的サイト（ビルド不要）。任意で Firebase 連携によりログイン編集・即時公開へ拡張可能。

## 構成

| パス | 内容 |
|---|---|
| `index.html` | 会員サイト本体（ヒーロー／コンセプト／ブランドの使い分け／翌月のおまかせ先行案内／会員プラン／接待・法人／特典／リゾート／入会ステップ／FAQ／CTA） |
| `menu.html` | 店舗ごとの「翌月のおまかせ」告知ページ（`?id=` で切替） |
| `join.html` | ご入会・カード登録ページ（Stripe 継続課金） |
| `functions/` | Cloud Functions（Stripe Checkout / Webhook） |
| `firebase.json` | Firebase デプロイ設定（functions / rules） |
| `tokushoho.html` | 特定商取引法に基づく表記 |
| `privacy.html` | プライバシーポリシー |
| `admin/index.html` | 管理画面（翌月のおまかせ編集ツール） |
| `data/omakase.json` | おまかせコンテンツ（静的モードの公開データ） |
| `assets/logo.svg` | ロゴ（ブランドマーク）。全ページで参照 |
| `assets/site-config.js` | 公開クライアント設定（Firebase 設定をここに入れる） |
| `assets/omakase.js` | コンテンツ読込モジュール（公開ページ共通） |
| `firestore.rules` / `storage.rules` | Firebase セキュリティルール |
| `.github/workflows/deploy.yml` | GitHub Pages 自動デプロイ |

## 店舗ラインナップ

| ブランド | 店舗 | ジャンル | おまかせ告知 |
|---|---|---|---|
| 大嵓埜（旗艦・主力） | 北新地 | 懐石料理 | `menu.html?id=daikouya-kitashinchi` |
| 大嵓埜（旗艦・主力） | 上七軒 | 寿司懐石 | `menu.html?id=daikouya-kamishichiken` |
| 禅園 | 心斎橋・西梅田（両店共通） | 懐石・割烹 | `menu.html?id=zenen` |
| L'Artisan Kanoya | （要確認） | フレンチ | `menu.html?id=lartisan-kanoya` |

> ⚠ **要確認**：大嵓埜の懐石／寿司懐石の北新地・上七軒の対応は仮置きです（管理画面で入替可）。
> L'Artisan Kanoya は外部サイトに接続できず、店舗名の読み・所在地・料理内容は仮置きです。正しい情報をいただければ更新します。

## 会員プラン

¥50,000／月（税抜・税込¥55,000）。毎月4ポイント付与（1pt=¥12,500相当／大嵓埜2pt・禅園1pt）。
お支払いはクレジットカード登録・自動継続課金（翌月分を前月末に課金）。解約は2ヶ月以上前の申し出。

## 翌月のおまかせ / 管理画面

各店舗の「翌月のおまかせ」を、料理写真＋概要付きで `menu.html` に掲載。トップページはその先行案内（大嵓埜を前面）。

`admin/index.html` をブラウザで開くと編集できます。動作は2モード：

### 静的モード（既定・Firebase未設定）
- 各エントリーの ブランド／店舗／ジャンル／対象月／料理名／概要／写真 を編集、ライブプレビュー。
- **下書き保存**＝ブラウザ（localStorage）。
- **公開**＝「公開用JSONを書き出す」→ `data/omakase.json` を差し替えてデプロイ。
- 画像は URL 指定、またはアップロード（data URL 埋め込み）。

### Firebase モード（`assets/site-config.js` に設定を入れると有効）
- 管理者ログイン（メール／パスワード）→ 編集 → **「公開」で即時反映**。
- 画像アップロードは Cloud Storage に保存しURLを自動設定。
- 公開ページは Firestore `content/omakase` を読み、未設定/失敗時は `data/omakase.json` にフォールバック。

#### Firebase セットアップ手順
1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクト作成。
2. **Authentication** を有効化 → メール/パスワード を ON → 管理者ユーザーを追加。
3. **Firestore Database** を作成 → ルールに `firestore.rules` を反映。
4. **Storage** を作成 → ルールに `storage.rules` を反映。
5. プロジェクト設定 → ウェブアプリを追加し、構成値を `assets/site-config.js` の `firebase` に貼付。
6. （任意）`content/omakase` ドキュメントが無い場合、管理画面で「公開」すると作成されます。

> Firebase の構成値（apiKey等）は公開クライアントキーで、フロントに置いて問題ありません。アクセス制御は認証＋ルールで担保します。

## 入会・カード登録（自動課金 / Stripe）

会費はクレジットカード登録による自動継続課金（翌月分を前月末に課金）。`join.html` が入会導線です。
`assets/site-config.js` の `stripe` 設定で挙動が切り替わります。

| 方式 | 設定 | 用途 |
|---|---|---|
| A. Payment Link（ノーコード） | `stripe.paymentLink` にURL | 最短で開始。Stripe管理画面で継続課金リンクを作成して貼るだけ |
| B. Checkout + Cloud Functions（推奨） | `stripe.checkoutFunctionUrl` にURL | ログイン会員と購読を紐付け。`functions/` をデプロイ |

### 方式B セットアップ（`functions/`）
1. Stripe で商品「ガストロノミー会員」と **継続課金 Price（月額 ¥55,000 税込）** を作成。
2. `firebase login` 後、`functions/` で `npm install`。
3. シークレット登録：
   ```sh
   firebase functions:secrets:set STRIPE_SECRET          # sk_live_xxx
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # whsec_xxx
   firebase functions:secrets:set STRIPE_PRICE_ID        # price_xxx（月額¥55,000）
   ```
4. `firebase deploy --only functions`（環境変数 `SITE_URL` に本番URL）。
5. Stripe の Webhook 宛先に `…/stripeWebhook` を登録（`customer.subscription.*`）。
6. デプロイされた `createCheckout` のURLを `assets/site-config.js` の `stripe.checkoutFunctionUrl` に設定。

> `functions/index.js` は `createCheckout`（カード登録＋購読開始）と `stripeWebhook`（購読状態を
> `users/{uid}.subscription` に同期）の実装。請求アンカーは当月末に設定（初月の按分は要件に応じ調整）。
> シークレットキーはクライアントに置かず、すべて Functions 側で扱います。

## 公開（GitHub Pages）

`.github/workflows/deploy.yml` で自動デプロイします。リポジトリの
**Settings → Pages → Build and deployment → Source = GitHub Actions** を選択してください。
`claude/gastronomy-membership-site-mmpk3x` または `main` への push で公開されます。

## ローカルプレビュー

```sh
python3 -m http.server 8000
# http://localhost:8000/ を開く（fetchを使うため file:// ではなくサーバー経由で）
```

## 公開前に差し替えるプレースホルダ（`TODO` 検索）

- **公式LINE URL** — `index.html` 末尾の `const LINE_URL="#";`。`site-config.js` に `lineUrl` を入れると `menu.html` のCTAにも反映。
- **ロゴ** — `assets/logo.svg` は公式ロゴ（100doorsandresorts.jp）を取得できなかったため、同系統で作成した**SVGワードマークの仮版**です。`assets/logo.svg` を公式ロゴファイル（同名で配置）に差し替えると、フッター・各サブページ・ヘッダーへ一括反映されます。ヒーローは読み込みフォントを用いたタイポ・ロックアップ。
- **QRコード** — フッターCTAの `.qr` はテキスト仮表示。
- **本番URL / OGP** — `index.html` の canonical / og:url / og:image（1200×630の `ogp.jpg`）。
- **会費の課金日／解約条件の細目** — `tokushoho.html`（規約と整合のうえ確定）。
- **L'Artisan Kanoya / 大嵓埜ジャンル対応** — 上記「要確認」を参照。

### 反映済みの会社情報（shonzui-inc.com より）

株式会社祥瑞／運営統括責任者 榎本泰之（代表取締役）／
〒530-0001 大阪府大阪市北区梅田2丁目5番25号 ハービスプラザ 地下2階／
TEL 06-6457-1002（平日10:00–18:00）／設立 2005年10月1日／資本金 6,000万円。

## 注意
- `admin/` `tokushoho.html` `privacy.html` `menu.html` は検索除外（noindex）設定。
- `tokushoho.html` の税込表示は税率10%で算定。
