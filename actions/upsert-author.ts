import assert from "node:assert"
import slug from "slug"
import type { MangaAuthor } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { authors } from "../db/schema"

export async function upsertAuthor(author: MangaAuthor) {
  const value: typeof authors.$inferInsert = {
    name: author.name,
    slug: slug(author.name)
  }

  const [authorId] = await db
    .insert(authors)
    .values(value)
    .onConflictDoUpdate({
      target: [authors.slug],
      set: value
    })
    .returning({ id: authors.id })

  assert(authorId, "Author ID is null")

  return authorId.id
}
