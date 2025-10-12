import { baseUrl } from "./config"
import type { Manga, MangaChapter } from "./types/manga"

export async function getManga(mangaId: string): Promise<Manga> {
  const res = await fetch(`${baseUrl}/api/v2/mangas/${mangaId}`)
  if (res.ok) {
    // biome-ignore lint/suspicious/noExplicitAny: <false>
    const { data } = (await res.json()) as { data: Manga }
    if (!Array.isArray(data.titles)) data.titles = [data.titles].filter(Boolean)

    return data as Manga
  } else {
    throw new Error(`Failed to fetch manga info: ${await res.text()} ${mangaId}`)
  }
}

export async function getMangaChapters(
  mangaId: string
): Promise<MangaChapter[]> {
  const res = await fetch(`${baseUrl}/api/v2/mangas/${mangaId}/chapters`)
  if (res.ok) {
    // biome-ignore lint/suspicious/noExplicitAny: <false>
    const { data } = (await res.json()) as any
    return data as MangaChapter[]
  } else {
    throw new Error(`Failed to fetch manga chapters: ${await res.text()}`)
  }
}
