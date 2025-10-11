import { integer, pgTable, unique } from "drizzle-orm/pg-core"
import { authors } from "./authors"
import { mangas } from "./mangas"

export const linkMangaAuthors = pgTable(
  "link_manga_authors",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    mangaId: integer()
      .notNull()
      .references(() => mangas.id),
    authorId: integer()
      .notNull()
      .references(() => authors.id)
  },
  table => [unique().on(table.mangaId, table.authorId)]
)
