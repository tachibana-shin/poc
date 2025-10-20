import assert from "node:assert"
import { and, eq } from "drizzle-orm"
import pLimit from "p-limit"
import sha256 from "sha256"
import { retryAsync } from "ts-retry"
import type { MangaChapter } from "../apis/cuutruyen/types/manga-chapter"
import { db } from "../db"
import { chapters, pages } from "../db/schema"
import { decrypt9truyen } from "./decrypt-9truyen"
import { type Cookie, transferTiktok } from "./transfer-tiktok"

export async function upsertChapter(
  manga_id_db: number,
  chapter: MangaChapter,
  cookie: Cookie
): Promise<boolean> {
  console.log("Upserting chapter ", chapter.id)
  const [lastUpdate] = await db
    .select({ updated_at: chapters.updated_at })
    .from(chapters)
    .where(
      and(eq(chapters.manga_id, manga_id_db), eq(chapters.raw_id, chapter.id))
    )
    .limit(1)

  if (
    lastUpdate &&
    lastUpdate.updated_at.getTime() >= new Date(chapter.updated_at).getTime()
  )
    return false

  const value = {
    raw_id: chapter.id,
    manga_id: manga_id_db,
    order: chapter.order,
    number: chapter.number,
    name: chapter.name,
    views_count: chapter.views_count,
    created_at: new Date(chapter.created_at),
    updated_at: new Date(chapter.updated_at)
  } satisfies typeof chapters.$inferInsert

  const [chapterDb] = await db
    .insert(chapters)
    .values(value)
    .onConflictDoUpdate({
      target: [chapters.raw_id],
      set: value
    })
    .returning({ id: chapters.id })

  assert(chapterDb, "Chapter not found")

  const limit = pLimit(Number(process.env.MAX_CONCURRENCY) || 20)

  const pagesDb = await db
    .select()
    .from(pages)
    .where(eq(pages.chapter_id, chapterDb.id))

  const uploadResults = await Promise.all(
    chapter.pages.map(async page => {
      return limit(() =>
        retryAsync(
          async () => {
            const exists = pagesDb.find(p => p.raw_id === page.id)

            const hash = sha256(page.image_url)
            if (exists && hash === exists.hash) {
              return false
            }

            if (process.env.FULL_LOG ?? true)
              console.log("Upserting page ", page.id)

            const { buffer, contentType } = await decrypt9truyen(
              page.image_url,
              page.drm_data
            )
            const tik = await transferTiktok(
              buffer,
              cookie,
              contentType,
              page.image_url
            )

            return { page, image_info: tik.data.image_info, hash }
          },
          {
            maxTry: Number(process.env.MAX_RETRY) || 10
          }
        )
      )
    })
  )

  await Promise.all(
    (
      uploadResults.filter(Boolean) as Exclude<
        (typeof uploadResults)[number],
        false
      >[]
    ).map(async ({ page, image_info, hash }) => {
      await db.insert(pages).values({
        raw_id: page.id,
        chapter_id: chapterDb.id,

        order: page.order,
        width: image_info.width,
        height: image_info.height,
        path: image_info.web_uri_v2,

        hash,
        size: image_info.size
      } satisfies typeof pages.$inferInsert)
    })
  )

  console.log("Upserted chapter ", chapterDb.id)

  return true
}
