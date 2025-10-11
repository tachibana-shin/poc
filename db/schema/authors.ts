import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

export const authors = pgTable("authors", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  slug: varchar().notNull().unique(),

  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow()
})
