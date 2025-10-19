import {
  index,
  integer,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core"
import { chapters } from "./chapters"

export const pages = pgTable(
  "pages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    raw_id: integer().notNull().unique(),

    chapter_id: integer()
      .references(() => chapters.id)
      .notNull(),

    order: integer().notNull(),
    width: integer(),
    height: integer(),
    path: varchar().notNull(),

    hash: varchar().notNull(),
    size: integer().notNull(),

    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  table => [index().on(table.chapter_id, table.order), index().on(table.hash)]
)
