import assert from "node:assert"
import slug from "slug"
import type { MangaTag } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { tags } from "../db/schema"

export async function upsertTag(tag: MangaTag) {
  const value: typeof tags.$inferInsert = {
    name: tag.name,
    slug: slug(tag.name)
  }

  const [tagId] = await db
    .insert(tags)
    .values(value)
    .onConflictDoUpdate({
      target: [tags.slug],
      set: value
    })
    .returning({ id: tags.id })

  assert(tagId, "Tag ID is null")

  return tagId.id
}
