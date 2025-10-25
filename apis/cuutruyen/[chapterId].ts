import { baseUrl, requestInit } from "./config"
import type { MangaChapter } from "./types/manga-chapter"

export async function getMangaChapter(
  chapterId: string
): Promise<MangaChapter> {
  const res = await fetch(`${baseUrl}/api/v2/chapters/${chapterId}`, requestInit)
  if (res.ok) {
    // biome-ignore lint/suspicious/noExplicitAny: <false>
    const { data } = (await res.json()) as any
    return data as MangaChapter
  } else {
    throw new Error(`Failed to fetch chapter info: ${await res.text()}`)
  }
}
