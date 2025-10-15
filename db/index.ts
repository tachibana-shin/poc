import assert from "node:assert"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import {
  authors,
  chapters,
  linkMangaTags,
  mangas,
  pages,
  tags,
  teams,
  titles
} from "./schema"

const connectionString = process.env.DATABASE_URL
assert(connectionString, "DATABASE_URL environment variable is not set")

export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, {
  schema: {
    authors,
    chapters,
    linkMangaTags,
    mangas,
    pages,
    tags,
    teams,
    titles
  }
})
