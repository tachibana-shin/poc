import pLimit from "p-limit"
import { transferTiktok } from "./actions/transfer-tiktok"
import { upsertManga, UpsertMangaStatus } from "./actions/upsert-manga"
import { getManga, getMangaChapters } from "./apis/cuutruyen/[mangaId]"
import { getRecently } from "./apis/cuutruyen/recently"
import cookie from "./cookie.json" with { type: "json" }
import { retryAsync } from "ts-retry"
import { sendToTelegram } from "./utils/send-to-telegram"

const success: { id: number; name: string; status: UpsertMangaStatus }[] = []
const fail: { id: number; name: string; error: string }[] = []
let lastPage = 1

const tiktokTest = await transferTiktok(
  "https://ssl.gstatic.com/images/icons/material/system/1x/done_white_16dp.png",
  cookie
)
  .then(o => ({ ok: true, data: o }) as const)
  .catch(e => ({ ok: false, error: e }) as const)
if (!tiktokTest.ok) {
  await sendToTelegram(`❌ *Tiktok cookie invalid. Please update and re-run*

\`\`\`json
${JSON.stringify(tiktokTest.error, null, 2)}
\`\`\`    

`)

  throw new Error("Tiktok cookie invalid. Please update and re-run")
}

async function done() {
  const okCount = success.length
  const failCount = fail.length
  const limitPreview = 10

  // 送信するテキストを整形
  const summary = [
    `📦 *Crawl Completed*`,
    `To page: ${lastPage}`,
    `✅ Success: ${okCount}`,
    `⌛ Enqueued: ${success.filter(x => x.status === UpsertMangaStatus.inEnqueued).length}`,
    `❌ Failed: ${failCount}`,
    "",
    ""
  ]

  function makeSuccess(item: (typeof success)[number]) {
    return `• *#${item.id}*${item.status === UpsertMangaStatus.inEnqueued ? " - [⌛]" : ""} \`${item.name}\``
  }
  function makeError(item: (typeof fail)[number]) {
    return `• *#${item.id}* - \`${item.name}\`:\n\`${item.error}\`\n\n`
  }

  if (okCount) {
    summary.push(`✅ *Success List:*`)
    summary.push(...success.slice(0, limitPreview).map(makeSuccess))
    if (okCount > limitPreview)
      summary.push(`...and ${okCount - limitPreview} more`)
    summary.push("")
  }

  if (failCount) {
    summary.push(`❌ *Fail List:*`)
    summary.push(...fail.slice(0, limitPreview).map(makeError))
    if (failCount > limitPreview)
      summary.push(`...and ${failCount - limitPreview} more`)
  }
  const fullLog =
    success.length > limitPreview || fail.length > limitPreview
      ? [
          "# 📦 Build Log\n",
          `**Page:** ${lastPage}`,
          `**Success:** ${okCount}`,
          `**Enqueued:** ${success.filter(x => x.status === UpsertMangaStatus.inEnqueued).length}`,
          `**Failed:** ${failCount}`,
          "\n## ✅ Success List",
          success.map(makeSuccess).join("\n") || "_none_",
          "\n## ❌ Fail List",
          fail.map(makeError).join("\n") || "_none_"
        ].join("\n")
      : null

  await sendToTelegram(
    summary.join("\n"),
    fullLog ? new File([fullLog], "build-log.md") : void 0,
    { notify: success.length > 0 || fail.length > 0 }
  )

  console.log("✅ Sent result to Telegram")
  process.exit(0)
}

for (let i = 1; ; i++) {
  const limit = pLimit(10)

  const mangas = await getRecently(i)
  if (mangas.data.length < 1) break
  console.groupCollapsed(`Page ${i}`)
  await Promise.all(
    mangas.data.map(manga =>
      limit(async () => {
        console.groupCollapsed(`Manga ${manga.id}`)

        try {
          const upserted = await upsertManga(
            await retryAsync(() => getManga(`${manga.id}`), {
              maxTry: 10,
              delay: 10_000
            }),
            await retryAsync(() => getMangaChapters(`${manga.id}`), {
              maxTry: 10,
              delay: 10_000
            }),
            cookie
          )

          if (upserted === UpsertMangaStatus.noUpdate) {
            limit.clearQueue()
            done()
          }

          success.push({ id: manga.id, name: manga.name, status: upserted })
        } catch (error) {
          fail.push({ id: manga.id, name: manga.name, error: `${error}` })
        }
        console.groupEnd()
        console.log("Done manga ", manga.id)
      })
    )
  )
  console.groupEnd()
  console.log("Done page ", i)

  lastPage = i
}

console.log("Done")
done()
