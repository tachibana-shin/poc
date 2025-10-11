import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: <true>
    url: process.env.DATABASE_URL!
  }
})
