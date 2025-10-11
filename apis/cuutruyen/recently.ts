import { baseUrl } from "./config"
import type { MangaListResponse } from "./types/recently"

export async function getRecently(page: number): Promise<MangaListResponse> {
  const res = await fetch(
    `${baseUrl}/api/v2/mangas/recently_updated?page=${page}&per_page=50`
  )
  if (res.ok) {
    const data = await res.json()
    return data as MangaListResponse
  } else {
    throw new Error(`Failed to fetch recently: ${await res.text()}`)
  }
}
