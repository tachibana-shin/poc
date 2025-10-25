import { baseUrl, requestInit } from "./config"
import type { Manga, MangaChapter } from "./types/manga"

export async function getManga(mangaId: string): Promise<Manga> {
  const res = await fetch(`${baseUrl}/api/v2/mangas/${mangaId}`, requestInit)
  if (res.ok) {
    // biome-ignore lint/suspicious/noExplicitAny: <false>
    const { data } = (await res.json()) as { data: Manga }
    if (!Array.isArray(data.titles)) data.titles = [data.titles].filter(Boolean)

    return data as Manga
  } else {
    throw new Error(
      `Failed to fetch manga info: ${await res.text()} ${mangaId}`
    )
  }
}

export async function getMangaChapters(
  mangaId: string
): Promise<{ data: MangaChapter[]; done: boolean }> {
  const res = await fetch(`${baseUrl}/api/v2/mangas/${mangaId}/chapters`, requestInit)
  if (res.ok) {
    // biome-ignore lint/suspicious/noExplicitAny: <false>
    const { data } = (await res.json()) as { data: MangaChapter[] }
    const filtered = data.filter(chapter => chapter.status !== "enqueued")
    return { data: filtered, done: data.length === filtered.length }
  } else {
    throw new Error(`Failed to fetch manga chapters: ${await res.text()}`)
  }
}
