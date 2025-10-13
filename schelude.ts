import pLimit from "p-limit"
import { transferTiktok } from "./actions/transfer-tiktok"
import { upsertManga } from "./actions/upsert-manga"
import { getManga, getMangaChapters } from "./apis/cuutruyen/[mangaId]"
import { getRecently } from "./apis/cuutruyen/recently"
import cookie from "./cookie.json" with { type: "json" }
import { retryAsync } from "ts-retry"
import { sendToTelegram } from "./utils/send-to-telegram"

const success: { id: number; name: string }[] = []
const fail: { id: number; name: string; error: string }[] = []
let lastPage = 1;

if (
 ! await transferTiktok(new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
    0xB1, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]), cookie, "image/png").then(res => res.data.image_info.web_uri_v2).catch(() => null)
) {
  await sendToTelegram(`❌ *Tiktok cookie invalid. Please update and re-run*`,)
  
  throw new Error("Tiktok cookie invalid. Please update and re-run");
}

async function done() {
  const okCount = success.length;
  const failCount = fail.length;

  // 送信するテキストを整形
  const summary = [
    `📦 *Build Completed*`,
    `Page: ${lastPage}`,
    `✅ Success: ${okCount}`,
    `❌ Failed: ${failCount}`,
    "",
  ];

  if (okCount) {
    summary.push(`✅ *Success List:*`);
    summary.push(...success.slice(0, 10).map(x => `• #${x.id} - \`${x.name}\``));
    if (okCount > 10) summary.push(`...and ${okCount - 10} more`);
    summary.push("");
  }

  if (failCount) {
    summary.push(`❌ *Fail List:*`);
    summary.push(...fail.slice(0, 10).map(x => `• #${x.id} - \`${x.name}\`: \`${x.error}\``));
    if (failCount > 10) summary.push(`...and ${failCount - 10} more`);
  }
  const fullLog = [
    "# 📦 Build Log\n",
    `**Page:** ${lastPage}`,
    `**Success:** ${okCount}`,
    `**Failed:** ${failCount}`,
    "\n## ✅ Success List",
    success.map(x => `- ${x.name} (#${x.id})`).join("\n") || "_none_",
    "\n## ❌ Fail List",
    fail.map(x => `- ${x.name}: ${x.error}`).join("\n") || "_none_",
  ].join("\n")

  await sendToTelegram(summary.join("\n"), new File([fullLog], "build-log.md"));

  console.log("✅ Sent result to Telegram");
  process.exit(0);

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
            await retryAsync(() => getManga(`${manga.id}`), { maxTry: 10, delay: 10_000 }),
            await retryAsync(() => getMangaChapters(`${manga.id}`), { maxTry: 10, delay: 10_000 }),
            cookie
          )

          success.push({ id: manga.id, name: manga.name })

          if (upserted) {
            limit.clearQueue();
            done()
          }
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