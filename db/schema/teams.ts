import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core"

export const teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  raw_id: integer().notNull().unique(),
  slug: varchar().notNull().unique(),
  name: varchar().notNull(),
  description: varchar().notNull(),
  is_ads: boolean().notNull(),
  facebook_address: varchar(),
  views_count: integer().notNull(),
  translations_count: integer().notNull(),

  main_page_blocks: varchar(),
  avatar_url: varchar().notNull(),

  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow()
})
