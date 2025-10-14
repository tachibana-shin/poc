import { desc } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core"
import { mangas } from "./mangas"

export const chapters = pgTable(
  "chapters",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    raw_id: integer().notNull().unique(),
    manga_id: integer()
      .notNull()
      .references(() => mangas.id),
    order: integer().notNull(),
    number: varchar().notNull(),
    name: varchar(),
    views_count: integer().notNull().default(0),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  table => [
    index("chapters_manga_id_order_desc_idx").on(
      table.manga_id,
      desc(table.order)
    ),
    index("chapters_views_count_order_desc_idx").on(desc(table.views_count))
  ]
)
