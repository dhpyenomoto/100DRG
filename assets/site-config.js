/* =====================================================================
   公開クライアント設定
   ---------------------------------------------------------------------
   Firebase の構成値（apiKey 等）は「公開クライアントキー」であり、
   フロントエンドに置いて問題ありません。実際のアクセス制御は
   Firebase Authentication ＋ セキュリティルール（firestore.rules /
   storage.rules）で行います。詳しい設定手順は README を参照。

   ・firebase を null のままにすると、サイトは静的JSON
     （data/omakase.json）と管理画面のローカル下書きで動作します。
   ・Firebase プロジェクトを作成し、下記コメントの形で値を設定すると、
     ログイン認証・即時公開・画像アップロードが有効になります。
   ===================================================================== */
window.SITE_CONFIG = {
  // 公式LINE 友だち追加URL（menu.html のCTAに反映。index.html は末尾の LINE_URL も参照）
  lineUrl: null,

  firebase: null

  /* 例（Firebase コンソール → プロジェクトの設定 → マイアプリ の値）:
  firebase: {
    apiKey:            "AIza...",
    authDomain:        "your-project.firebaseapp.com",
    projectId:         "your-project",
    storageBucket:     "your-project.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:xxxxxxxxxxxx"
  }
  */
};
