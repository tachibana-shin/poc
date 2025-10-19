import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  varchar
} from "drizzle-orm/pg-core"
import { mangas } from "./mangas"

export const titles = pgTable(
  "titles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    raw_id: integer().notNull().unique(),

    manga_id: integer()
      .notNull()
      .references(() => mangas.id),
    name: varchar().notNull(),
    primary: boolean().notNull(),

    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  table => [
    unique().on(table.manga_id, table.name),
    index().on(table.manga_id, table.primary),
    index("title_search_index").using("gin", sql`${table.name} gin_trgm_ops`)
  ]
)
