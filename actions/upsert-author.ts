import assert from "node:assert"
import slug from "slug"
import type { MangaAuthor } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { authors } from "../db/schema"

const authorsStore = new Map<string, number>()
export async function upsertAuthor(author: MangaAuthor) {
  if (authorsStore.has(author.name)) return authorsStore.get(author.name)!;

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
  authorsStore.set(author.name, authorId.id)

  return authorId.id
}
