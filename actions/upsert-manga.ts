import assert from "node:assert"
import { eq } from "drizzle-orm"
import pLimit from "p-limit"
import { retryAsync } from "ts-retry"
import { getMangaChapter } from "../apis/cuutruyen/[chapterId]"
import type { Manga, MangaChapter } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { linkMangaAuthors, linkMangaTags, mangas } from "../db/schema"
import { type Cookie, transferTiktok } from "./transfer-tiktok"
import { upsertAuthor } from "./upsert-author"
import { upsertChapter } from "./upsert-chapter"
import { upsertTag } from "./upsert-tag"
import { upsertTeam } from "./upsert-team"

export async function upsertManga(
  manga: Manga,
  chapters: MangaChapter[],
  cookie: Cookie
): Promise<boolean> {
  let [lastUpdate] = await db
    .select({ id: mangas.id, updated_at: mangas.updated_at })
    .from(mangas)
    .where(eq(mangas.raw_id, manga.id))
    .limit(1)

  if (
    lastUpdate &&
    lastUpdate.updated_at.getTime() >= new Date(manga.updated_at).getTime()
  )
    return false

  if (!lastUpdate) {
    // not found insert this
    // Run all transferTiktok in parallel
    const [cover, coverMobile, pano, panoMobile, teamId] = await Promise.all([
      retryAsync(() => transferTiktok(manga.cover_url, cookie), { maxTry: 10 }),
      manga.cover_mobile_url ? retryAsync(() => transferTiktok(manga.cover_mobile_url!, cookie), { maxTry: 10 }) : null,
      manga.panorama_url ? retryAsync(() => transferTiktok(manga.panorama_url!, cookie), { maxTry: 10 }) : null,
      manga.panorama_mobile_url ? retryAsync(() => transferTiktok(manga.panorama_mobile_url!, cookie), { maxTry: 10 }) : null,
      upsertTeam(manga.team, cookie)
    ] as const)

    // Then assign results
    manga.cover_url = cover.data.image_info.web_uri_v2
    manga.cover_mobile_url = coverMobile?.data.image_info.web_uri_v2
    manga.panorama_url = pano?.data.image_info.web_uri_v2
    manga.panorama_mobile_url = panoMobile?.data.image_info.web_uri_v2

    const value: typeof mangas.$inferInsert = {
      raw_id: manga.id,
      name: manga.name,
      cover_url: manga.cover_url,
      cover_mobile_url: manga.cover_mobile_url,
      panorama_url: manga.panorama_url,
      panorama_mobile_url: manga.panorama_mobile_url,
      panorama_dominant_color: manga.panorama_dominant_color,
      panorama_dominant_color_2: manga.panorama_dominant_color_2,
      description: manga.description,
      full_description: manga.full_description,
      official_url: manga.official_url,
      is_region_limited: manga.is_region_limited,
      is_ads: manga.is_ads,
      views_count: manga.views_count,
      is_nsfw: manga.is_nsfw,
      team: teamId,
      titles: manga.titles,
      created_at: new Date(manga.created_at),
      updated_at: new Date(new Date(manga.updated_at).getTime() - 1_0000)
    }

      ;[lastUpdate] = await db
        .insert(mangas)
        .values(value)
        .returning({ id: mangas.id, updated_at: mangas.updated_at })
  } else {
    await db
      .update(mangas)
      .set({
        name: manga.name,
        description: manga.description,
        full_description: manga.full_description,
        official_url: manga.official_url,
        is_region_limited: manga.is_region_limited,
        is_ads: manga.is_ads,
        views_count: manga.views_count,
        is_nsfw: manga.is_nsfw,
        team: await upsertTeam(manga.team, cookie),
        titles: manga.titles
      })
      .where(eq(mangas.id, lastUpdate.id))
  }

  // meta done
  // next update tags
  //
  assert(lastUpdate, "Manga is undefined")
  const tagsIdDb = await Promise.all(
    manga.tags.map(async tag => await upsertTag(tag))
  )

  if (tagsIdDb.length > 0)
    await db
      .insert(linkMangaTags)
      .values(
        tagsIdDb.map(tagId => ({
          mangaId: lastUpdate.id,
          tagId: tagId
        })) satisfies Array<typeof linkMangaTags.$inferInsert>
      )
      .onConflictDoNothing()

  const authorsIdDb = await Promise.all(
    manga.author.name
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
      .map(async author => await upsertAuthor({ name: author }))
  )

  if (authorsIdDb.length > 0)
    await db
      .insert(linkMangaAuthors)
      .values(
        authorsIdDb.map(authorId => ({
          mangaId: lastUpdate.id,
          authorId: authorId
        })) satisfies Array<typeof linkMangaAuthors.$inferInsert>
      )
      .onConflictDoNothing()

  // update chapters
  const limit = pLimit(5)
  await Promise.all(
    chapters.map(chapter =>
      limit(async () =>
        upsertChapter(
          lastUpdate.id,
          await getMangaChapter(`${chapter.id}`),
          cookie
        )
      )
    )
  )

  await db
    .update(mangas)
    .set({
      updated_at: new Date(manga.updated_at)
    })
    .where(eq(mangas.id, lastUpdate.id))

  return true
}
