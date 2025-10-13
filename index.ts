import { writeFile } from "node:fs/promises"
import pLimit from "p-limit"
import { upsertManga } from "./actions/upsert-manga"
import { getManga, getMangaChapters } from "./apis/cuutruyen/[mangaId]"
import { getRecently } from "./apis/cuutruyen/recently"
import cookie from "./cookie.json" with { type: "json" }
import { retryAsync } from "ts-retry"

// console.log(
//   await transferTiktok(
//     "https://storage-ct.lrclib.net/file/cuutruyen/uploads/manga/3633/cover/processed-9ea3f1d8c03955fdc221e40cdeb3974b.jpg",
//     cookie
//   )
// )
//
const pageStart = Number.parseInt(
  (await Bun.file("./page_ok.log").text())
    .split("\n")
    .findLast(line => !!line.trim())
    ?.slice(1)
    .trim() ?? ""
)
if (Number.isNaN(pageStart)) throw new Error("page_ok.log format invalid")

for (let i = pageStart + 1; ; i++) {
  const limit = pLimit(10)

  const mangas = await getRecently(i).catch(error =>
    error.message?.includes("Lỗi không xác định đã xảy ra")
      ? null
      : Promise.reject(error)
  )
  if (mangas === null || mangas.data.length < 1) break
  console.groupCollapsed(`Page ${i}`)
  await Promise.all(
    mangas.data.map(manga =>
      limit(async () => {
        console.groupCollapsed(`Manga ${manga.id}`)

        try {
          await upsertManga(
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

          await writeFile("manga_ok.log", `#${manga.id}: ${manga.name}\n`, {
            flag: "a"
          })
        } catch (error) {
          console.error(error)
          // append log error and id manga and info newline to file error.log
          await writeFile(
            "error.log",
            `#${manga.id}(${new Date()}): ${error}\n`,
            { flag: "a" }
          )
        }
        console.groupEnd()
        console.log("Done manga ", manga.id)
      })
    )
  )
  console.groupEnd()
  console.log("Done page ", i)
  await writeFile("page_ok.log", `#${i}\n`, {
    flag: "a"
  })

  if (mangas._metadata.current_page >= mangas._metadata.total_pages) break
}
// await upsertManga(
//   await getManga("3758"),
//   await getMangaChapters("3758"),
//   cookie
// )
console.log("Done")
