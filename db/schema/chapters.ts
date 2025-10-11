import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"
import { mangas } from "./mangas"

export const chapters = pgTable("chapters", {
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
})
