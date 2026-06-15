/* =====================================================================
   祥瑞 ガストロノミー会員 — Stripe 継続課金（Cloud Functions v2）
   ---------------------------------------------------------------------
   - createCheckout : ログイン会員のカード登録＋サブスクリプション開始
                      （Stripe Checkout, mode=subscription）
   - stripeWebhook  : 購読状態を Firestore(users/{uid}.subscription) に同期

   デプロイ前の準備（README参照）:
     firebase functions:secrets:set STRIPE_SECRET
     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
     firebase functions:secrets:set STRIPE_PRICE_ID   # 月額¥55,000(税込)のPrice ID
   実行環境変数 SITE_URL に本番URLを設定。
   ===================================================================== */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const STRIPE_SECRET = defineSecret("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const STRIPE_PRICE_ID = defineSecret("STRIPE_PRICE_ID");

const REGION = "asia-northeast1";
const SITE_URL = process.env.SITE_URL || "https://example.com";

// 「翌月分を前月末に課金」: 請求サイクルのアンカーを当月末日（23:59:59）に設定
function endOfMonthUnix() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return Math.floor(end.getTime() / 1000);
}

// ---- 入会：Checkout セッション作成（要 Firebase IDトークン）----
exports.createCheckout = onRequest(
  { region: REGION, cors: true, secrets: [STRIPE_SECRET, STRIPE_PRICE_ID] },
  async (req, res) => {
    try {
      if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
      const { idToken } = req.body || {};
      if (!idToken) { res.status(401).json({ error: "missing_token" }); return; }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || undefined;
      const stripe = new Stripe(STRIPE_SECRET.value());

      // Stripe 顧客の再利用 or 作成
      const userRef = db.collection("users").doc(uid);
      const snap = await userRef.get();
      let customerId = snap.exists ? snap.get("stripeCustomerId") : null;
      if (!customerId) {
        const customer = await stripe.customers.create({ email, metadata: { uid } });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId, email }, { merge: true });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: STRIPE_PRICE_ID.value(), quantity: 1 }],
        subscription_data: {
          billing_cycle_anchor: endOfMonthUnix(),  // 月末課金にアンカー
          proration_behavior: "create_prorations"  // 初月の取り扱いは要件に応じ調整
        },
        success_url: `${SITE_URL}/join.html?status=success`,
        cancel_url: `${SITE_URL}/join.html?status=cancel`,
        metadata: { uid }
      });
      res.json({ url: session.url });
    } catch (e) {
      console.error("createCheckout", e);
      res.status(500).json({ error: "server_error" });
    }
  }
);

// ---- Webhook：購読状態の同期 ----
exports.stripeWebhook = onRequest(
  { region: REGION, secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET.value());
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (e) {
      console.error("webhook_signature", e);
      res.status(400).send("bad signature");
      return;
    }

    try {
      const obj = event.data.object;
      if (event.type.startsWith("customer.subscription.")) {
        const customerId = obj.customer;
        const q = await db.collection("users")
          .where("stripeCustomerId", "==", customerId).limit(1).get();
        if (!q.empty) {
          const priceId = obj.items && obj.items.data && obj.items.data[0]
            ? obj.items.data[0].price.id : null;
          await q.docs[0].ref.set({
            subscription: {
              status: obj.status,
              current_period_end: obj.current_period_end || null,
              cancel_at_period_end: !!obj.cancel_at_period_end,
              priceId
            }
          }, { merge: true });
        }
      }
      res.json({ received: true });
    } catch (e) {
      console.error("webhook_handle", e);
      res.status(500).send("error");
    }
  }
);
