import assert from "node:assert"
import slug from "slug"
import type { MangaTag } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { tags } from "../db/schema"

const tagsStore = new Map<string, number>()
export async function upsertTag(tag: MangaTag) {
  if (tagsStore.has(tag.name)) return tagsStore.get(tag.name)!;

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
  tagsStore.set(tag.name, tagId.id)

  return tagId.id
}
