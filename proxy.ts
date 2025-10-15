// server.ts
// コメント: シンプルなプロキシサーバー。query param 'url' を受け取り、そのレスポンスをそのまま返す。
// 注意: このコードは SSRF のリスクがあります。必要ならホワイトリストや認証を追加してください。

import { serve } from "bun"; // Bun のグローバルでも動きますが、明示的に import しておくと読みやすいです。

const PORT = 3000;
const WORKERS = 2;

const server = serve({
  port: PORT,
  // worker 数を指定してクラスタリング（プロセス/スレッド分散）を行う
  workers: WORKERS,
  async fetch(req: Request) {
    try {
      // リクエスト URL から query param を取り出す
      const urlObj = new URL(req.url, `http://${req.headers.get("host") ?? "localhost"}`);
      const target = urlObj.searchParams.get("url");
      if (!target) {
        return new Response(JSON.stringify({ error: "missing 'url' query parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // validate URL
      let targetUrl: URL;
      try {
        targetUrl = new URL(target);
      } catch {
        return new Response(JSON.stringify({ error: "invalid url" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 必要ならここでホワイトリストチェック等を行う

      // フェッチを行う（GET 固定）。ヘッダーやメソッドを転送したい場合はここを拡張する。
      const upstream = await fetch(targetUrl.toString(), {
        method: "GET",
        // redirect follow はデフォルトで follow
        // credentials はデフォルトで 'omit'
      });

      // upstream のヘッダを複製
      const forwardedHeaders = new Headers(upstream.headers);

      // CORS を簡易許可（必要に応じて削る）
      forwardedHeaders.set("Access-Control-Allow-Origin", "*");

      // そのままストリームを返す（バイナリも可）
      return new Response(upstream.body, {
        status: upstream.status,
        headers: forwardedHeaders,
      });
    } catch (err) {
      // 予期しないエラー
      return new Response(JSON.stringify({ error: "internal server error", detail: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

console.log(`Bun proxy server running on http://localhost:${PORT}  (workers=${WORKERS})`);
