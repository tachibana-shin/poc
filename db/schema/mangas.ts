import {
  boolean,
  integer,
  json,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core"
import { teams } from "./teams"

export const mangas = pgTable("mangas", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  raw_id: integer().notNull().unique(),

  name: varchar().notNull().unique(),
  cover_url: varchar().notNull(),
  cover_mobile_url: varchar().notNull(),
  panorama_url: varchar().notNull(),
  panorama_mobile_url: varchar().notNull(),
  panorama_dominant_color: varchar().notNull(),
  panorama_dominant_color_2: varchar().notNull(),
  description: varchar().notNull(),
  full_description: varchar().notNull(),
  official_url: varchar(),
  is_region_limited: boolean().notNull(),
  is_ads: boolean().notNull(),
  views_count: integer().notNull(),
  is_nsfw: boolean().notNull(),

  team: integer()
    .notNull()
    .references(() => teams.id),
  titles: json().array().notNull(),

  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow()
})
