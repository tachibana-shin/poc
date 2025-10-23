// 全 fetch リクエストを 1 秒間隔に制限する。

export function patch() {
  let lastFetchTime = 0 // timestamp of last fetch
  const originalFetch = globalThis.fetch

  // fetch をラップする
  globalThis.fetch = Object.assign(
    async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const now = Date.now()
      const elapsed = now - lastFetchTime
      const wait = Math.max(0, 1000 - elapsed)

      if (wait > 0) {
        // 前回から 1 秒経っていなければ待機
        await new Promise(r => setTimeout(r, wait))
      }

      lastFetchTime = Date.now()
      return originalFetch(...args)
    },
    {
      preconnect: originalFetch.preconnect.bind(originalFetch)
    }
  )

  console.log("🧩 fetch() is now throttled (1 request per second)")
}
