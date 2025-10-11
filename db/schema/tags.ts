import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

export const tags = pgTable("tags", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull().unique(),
  slug: varchar().notNull().unique(),
  created_at: timestamp().notNull().defaultNow()
})
