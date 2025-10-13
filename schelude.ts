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

  // 送信するテキストを整形
  const summary = [
    `📦 *Build Completed*`,
    `Page: ${lastPage}`,
    `✅ Success: ${okCount}`,
    `🌵 Enqueued: ${success.filter(x => x.status === UpsertMangaStatus.inEnqueued).length}`,
    `❌ Failed: ${failCount}`,
    ""
  ]

  if (okCount) {
    summary.push(`✅ *Success List:*`)
    summary.push(...success.slice(0, 10).map(x => `• #${x.id}${x.status === UpsertMangaStatus.inEnqueued ? ' - [⌛]' : ''} \`${x.name}\``))
    if (okCount > 10) summary.push(`...and ${okCount - 10} more`)
    summary.push("")
  }

  if (failCount) {
    summary.push(`❌ *Fail List:*`)
    summary.push(
      ...fail
        .slice(0, 10)
        .map(x => `• #${x.id} - \`${x.name}\`: \`${x.error}\``)
    )
    if (failCount > 10) summary.push(`...and ${failCount - 10} more`)
  }
  const fullLog = [
    "# 📦 Build Log\n",
    `**Page:** ${lastPage}`,
    `**Success:** ${okCount}`,
    `**Enqueued:** ${success.filter(x => x.status === UpsertMangaStatus.inEnqueued).length}`,
    `**Failed:** ${failCount}`,
    "\n## ✅ Success List",
    success.map(x => `- #${x.id}${x.status === UpsertMangaStatus.inEnqueued ? ' - [⌛]' : ''} (\`${x.name}\`)`).join("\n") || "_none_",
    "\n## ❌ Fail List",
    fail.map(x => `- #${x.id} (\`${x.name}\`): ${x.error}`).join("\n") || "_none_"
  ].join("\n")

  await sendToTelegram(summary.join("\n"), new File([fullLog], "build-log.md"))

  console.log("✅ Sent result to Telegram")
  process.exit(0)

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
