/* =====================================================================
   おまかせコンテンツ ローダー（公開ページ共通）
   - SITE_CONFIG.firebase が設定されていれば Firestore(content/omakase) から読込
   - 未設定 or 失敗時は data/omakase.json にフォールバック
   index.html / menu.html の双方から利用。
   ===================================================================== */
const FB_VER = "10.12.0";

export async function loadOmakase() {
  const cfg = window.SITE_CONFIG && window.SITE_CONFIG.firebase;
  if (cfg) {
    try {
      const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`);
      const { getFirestore, doc, getDoc } = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`);
      const db = getFirestore(initializeApp(cfg));
      const snap = await getDoc(doc(db, "content", "omakase"));
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.warn("Firebase からの読込に失敗。静的JSONを使用します。", e);
    }
  }
  const r = await fetch("data/omakase.json", { cache: "no-store" });
  if (!r.ok) throw new Error("omakase.json load failed");
  return r.json();
}

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function storeById(data, id) {
  return (data.stores || []).find(s => s.id === id) || null;
}
