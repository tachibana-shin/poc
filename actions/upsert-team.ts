import assert from "node:assert"
import { eq } from "drizzle-orm"
import slug from "slug"
import { retryAsync } from "ts-retry"
import type { MangaTeam } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { teams } from "../db/schema"
import { type Cookie, transferTiktok } from "./transfer-tiktok"

export async function upsertTeam(team: MangaTeam, cookie: Cookie) {
  let [lastUpdate] = await db
    .select({ id: teams.id, updated_at: teams.updated_at })
    .from(teams)
    .where(eq(teams.raw_id, teams.id))
    .limit(1)

  if (
    lastUpdate &&
    lastUpdate.updated_at.getTime() >= new Date(team.updated_at).getTime()
  )
    return lastUpdate.id

  team.avatar_url = await retryAsync(() =>
    transferTiktok(team.avatar_url, cookie)
  ).then(res => res.data.image_info.web_uri_v2)

  const value: typeof teams.$inferInsert = {
    raw_id: team.id,
    slug: slug(team.name),
    name: team.name,
    description: team.description,
    is_ads: team.is_ads,
    facebook_address: team.facebook_address,
    views_count: team.views_count,
    translations_count: team.translations_count,
    main_page_blocks: team.main_page_blocks,
    avatar_url: team.avatar_url,
    created_at: new Date(team.created_at),
    updated_at: new Date(team.updated_at)
  }
  ;[lastUpdate] = await db
    .insert(teams)
    .values(value)
    .onConflictDoUpdate({
      target: [teams.slug],
      set: value
    })
    .returning({ id: teams.id, updated_at: teams.updated_at })

  assert(lastUpdate, "Team ID is null")

  return lastUpdate.id
}
