import { index, integer, pgTable, timestamp, unique } from "drizzle-orm/pg-core"
import { mangas } from "./mangas"
import { tags } from "./tags"

export const linkMangaTags = pgTable(
  "link_manga_tags",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    mangaId: integer()
      .references(() => mangas.id)
      .notNull(),
    tagId: integer()
      .references(() => tags.id)
      .notNull(),

    created_at: timestamp().notNull().defaultNow()
  },
  table => [unique().on(table.mangaId, table.tagId), index().on(table.tagId)]
)
