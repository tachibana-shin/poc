import { eq, inArray } from "drizzle-orm"
import type { MangaTitle } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { titles } from "../db/schema"
import { upsertTitle } from "./upsert-title"

export async function upsertTitles(mangaId: number, data: MangaTitle[]) {
  const currentNames = await db
    .select({
      id: titles.id
    })
    .from(titles)
    .where(eq(titles.manga_id, mangaId))

  const storeName = new Set<string>()
  for (let index = 0; index < data.length; index++) {
    // biome-ignore lint/style/noNonNullAssertion: <true>
    const title = data[index]!
    if (storeName.has(title.name)) {
      const i = Number.parseInt(title.name.match(/(\d+)$/)?.[1] ?? "1", 10)

      title.name = `${title.name.replace(/\w+\d+$/, "")} (${i + 1})`
      index--
      console.log(`Duplicate title found: ${title.name}`)
      continue
    }

    storeName.add(title.name)
  }

  const validate = new Set(
    await Promise.all(data.map(title => upsertTitle(mangaId, title)))
  )
  const removed = currentNames
    .filter(title => !validate.has(title.id))
    .map(title => title.id)

  await db.delete(titles).where(inArray(titles.id, removed))
}
