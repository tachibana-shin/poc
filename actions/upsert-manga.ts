import assert from "node:assert"
import { and, count, eq, inArray, not } from "drizzle-orm"
import pLimit from "p-limit"
import { retryAsync } from "ts-retry"
import { getMangaChapter } from "../apis/cuutruyen/[chapterId]"
import type { Manga, MangaChapter } from "../apis/cuutruyen/types/manga"
import { db } from "../db"
import { chapters as chaptersDB } from "../db/schema"
import { linkMangaAuthors, linkMangaTags, mangas } from "../db/schema"
import { type Cookie, transferTiktok } from "./transfer-tiktok"
import { upsertAuthor } from "./upsert-author"
import { upsertChapter } from "./upsert-chapter"
import { upsertTag } from "./upsert-tag"
import { upsertTeam } from "./upsert-team"
import { upsertTitles } from "./upsert-titles"

export enum UpsertMangaStatus {
  noUpdate,
  Updated,
  inEnqueued
}

export async function upsertManga(
  manga: Manga,
  { data: chapters, done: chaptersOk }: { data: MangaChapter[]; done: boolean },
  cookie: Cookie
): Promise<UpsertMangaStatus> {
  let [lastUpdate] = await db
    .select({ id: mangas.id, updated_at: mangas.updated_at })
    .from(mangas)
    .where(eq(mangas.raw_id, manga.id))
    .limit(1)
  const [countChapters] = lastUpdate
    ? await db
        .select({
          count: count(chaptersDB.id)
        })
        .from(chaptersDB)
        .where(eq(chaptersDB.manga_id, lastUpdate.id))
    : [{ count: 0 }]

  if (
    lastUpdate &&
    lastUpdate.updated_at.getTime() >= new Date(manga.updated_at).getTime() &&
    (countChapters?.count ?? 0) < chapters.length
  )
    return UpsertMangaStatus.noUpdate

  if (!lastUpdate) {
    // not found insert this
    // Run all transferTiktok in parallel
    const [cover, coverMobile, pano, panoMobile, teamId] = await Promise.all([
      retryAsync(() => transferTiktok(manga.cover_url, cookie), { maxTry: 10 }),
      manga.cover_mobile_url
        ? // biome-ignore lint/style/noNonNullAssertion: <false>
          retryAsync(() => transferTiktok(manga.cover_mobile_url!, cookie), {
            maxTry: 10
          })
        : null,
      retryAsync(() => transferTiktok(manga.panorama_url, cookie), {
        maxTry: 10
      }),
      manga.panorama_mobile_url
        ? // biome-ignore lint/style/noNonNullAssertion: <false>
          retryAsync(() => transferTiktok(manga.panorama_mobile_url!, cookie), {
            maxTry: 10
          })
        : null,
      upsertTeam(manga.team, cookie)
    ] as const)

    // Then assign results
    manga.cover_url = cover.data.image_info.web_uri_v2
    manga.cover_mobile_url = coverMobile?.data.image_info.web_uri_v2
    manga.panorama_url = pano?.data.image_info.web_uri_v2
    manga.panorama_mobile_url = panoMobile?.data.image_info.web_uri_v2

    const value: typeof mangas.$inferInsert = {
      raw_id: manga.id,
      // name: manga.name,
      cover_url: manga.cover_url,
      cover_mobile_url: manga.cover_mobile_url,
      panorama_url: manga.panorama_url,
      panorama_mobile_url: manga.panorama_mobile_url,
      panorama_dominant_color: manga.panorama_dominant_color,
      panorama_dominant_color_2: manga.panorama_dominant_color_2,
      description: manga.description ?? "",
      full_description: manga.full_description ?? "",
      official_url: manga.official_url,
      is_region_limited: manga.is_region_limited,
      is_ads: manga.is_ads,
      views_count: manga.views_count,
      is_nsfw: manga.is_nsfw,
      team: teamId,
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
        // name: manga.name,
        description: manga.description,
        full_description: manga.full_description ?? "",
        official_url: manga.official_url,
        is_region_limited: manga.is_region_limited,
        is_ads: manga.is_ads,
        views_count: manga.views_count,
        is_nsfw: manga.is_nsfw,
        team: await upsertTeam(manga.team, cookie)
      })
      .where(eq(mangas.id, lastUpdate.id))
  }

  // meta done
  // next update tags
  //
  assert(lastUpdate, "Manga is undefined")
  await upsertTitles(lastUpdate.id, manga.titles)

  const tagsIdDb = Array.from(
    new Set(
      await Promise.all(manga.tags.map(async tag => await upsertTag(tag)))
    )
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
  // delete tags removed
  await db
    .delete(linkMangaTags)
    .where(
      and(
        eq(linkMangaTags.mangaId, lastUpdate.id),
        not(inArray(linkMangaTags.tagId, tagsIdDb))
      )
    )

  const authorsIdDb = Array.from(
    new Set(
      await Promise.all(
        manga.author.name
          .split(",")
          .map(item => item.trim())
          .filter(Boolean)
          .map(async author => await upsertAuthor({ name: author }))
      )
    )
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
  // delete authors removed
  await db
    .delete(linkMangaAuthors)
    .where(
      and(
        eq(linkMangaAuthors.mangaId, lastUpdate.id),
        not(inArray(linkMangaAuthors.authorId, authorsIdDb))
      )
    )

  // update chapters
  const limit = pLimit(5)
  await Promise.all(
    chapters.map(chapter =>
      limit(async () =>
        upsertChapter(
          lastUpdate.id,
          await retryAsync(() => getMangaChapter(`${chapter.id}`), {
            maxTry: 10
          }),
          cookie
        )
      )
    )
  )

  if (chaptersOk)
    await db
      .update(mangas)
      .set({
        updated_at: new Date(manga.updated_at)
      })
      .where(eq(mangas.id, lastUpdate.id))

  return chaptersOk ? UpsertMangaStatus.Updated : UpsertMangaStatus.inEnqueued
}
