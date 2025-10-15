import assert from "node:assert"
import { and, eq } from "drizzle-orm"
import { db } from "../db"
import { titles } from "../db/schema"

export async function upsertTitle(
  manga_id: number,
  title: { id: number; name: string; primary: boolean }
) {
  const [exist] = await db
    .select({ id: titles.id, name: titles.name, primary: titles.primary })
    .from(titles)
    .where(and(eq(titles.manga_id, manga_id), eq(titles.raw_id, title.id)))
    .limit(1)
  if (exist) {
    if (exist.primary !== title.primary || exist.name !== title.name) {
      await db
        .update(titles)
        .set({
          name: title.name,
          primary: title.primary
        })
        .where(eq(titles.id, exist.id))
    }

    return exist.id
  }

  const [titleId] = await db
    .insert(titles)
    .values({
      manga_id,
      raw_id: title.id,
      name: title.name,
      primary: title.primary
    } satisfies typeof titles.$inferInsert)
    .returning({ id: titles.id })

  assert(titleId, "Title ID is null")

  return titleId.id
}
