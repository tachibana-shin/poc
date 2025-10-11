import { writeFile } from "node:fs/promises"
import pLimit from "p-limit"
import { decrypt9truyen } from "./actions/decrypt-9truyen"
import { transferTiktok } from "./actions/transfer-tiktok"
import { upsertManga } from "./actions/upsert-manga"
import { getManga, getMangaChapters } from "./apis/cuutruyen/[mangaId]"
import { getRecently } from "./apis/cuutruyen/recently"
import cookie from "./cookie.json" with { type: "json" }

// console.log(
//   await transferTiktok(
//     "https://storage-ct.lrclib.net/file/cuutruyen/uploads/manga/3633/cover/processed-9ea3f1d8c03955fdc221e40cdeb3974b.jpg",
//     cookie
//   )
// )
//

for (let i = 1; ; i++) {
  const limit = pLimit(10)

  const mangas = await getRecently(i)
  console.groupCollapsed(`Page ${i}`)
  await Promise.all(
    mangas.data.map(manga =>
      limit(async () => {
        console.groupCollapsed(`Manga ${manga.id}`)

        try {
          await upsertManga(
            await getManga(`${manga.id}`),
            await getMangaChapters(`${manga.id}`),
            cookie
          )

          await writeFile("manga_ok.log", `#${manga.id}: ${manga.name}\n`, {
            flag: "a"
          })
        } catch (error) {
          console.error(error)
          // append log error and id manga and info newline to file error.log
          await writeFile("error.log", `#${manga.id}(${new Date()}): ${error}\n`, { flag: "a" })
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
}
// await upsertManga(
//   await getManga("3758"),
//   await getMangaChapters("3758"),
//   cookie
// )
console.log("Done")
